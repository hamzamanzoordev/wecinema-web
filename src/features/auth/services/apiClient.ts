/**
 * Client-side API client for wecinema-web.
 *
 * - Attaches Bearer token from tokenStorage on every request.
 * - withCredentials: sends httpOnly refresh cookie automatically (credentials: "include").
 * - On 401: silently calls POST /api/user/refresh, retries once, then calls _onUnauthorized.
 * - All refresh callers (this client and AuthContext's session restore) share one in-flight
 *   request. The backend rotates the refresh token on every call, so two parallel calls
 *   carrying the same cookie look like token reuse and revoke every session.
 * - The same applies ACROSS TABS (they share the cookie): refreshes are serialised with
 *   the Web Locks API, so a second tab waits and then refreshes with the rotated cookie.
 * - Only a 401/403 from /user/refresh ends the session. A network drop, timeout, 429 or
 *   5xx is transient and never logs anyone out.
 * - startSessionKeeper() renews the access token shortly before it expires, and again when
 *   a tab comes back to the foreground, so an active user never meets an expired token.
 */

import { tokenStorage } from "./tokenStorage";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

// ─── Silent refresh state ────────────────────────────────────

let _onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

export interface RefreshResult<U = unknown> {
  token: string;
  user?: U;
}

/** One refresh attempt. `expired` means the server rejected the session; otherwise it was transient. */
export type RefreshOutcome<U = unknown> =
  | { ok: true; result: RefreshResult<U> }
  | { ok: false; expired: boolean };

const REFRESH_LOCK = "wecinema-session-refresh";
const REFRESH_TIMEOUT_MS = 20_000;

let _refreshInFlight: Promise<RefreshOutcome> | null = null;

/** Hold a lock shared by every tab of this origin. Browsers without Web Locks run unlocked. */
function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks?.request ? (locks.request(REFRESH_LOCK, fn) as Promise<T>) : fn();
}

async function doRefresh(): Promise<RefreshOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/user/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      // The server rotates the cookie as soon as it handles this request. keepalive lets
      // the response (and its Set-Cookie) land even if the page navigates or reloads
      // meanwhile — otherwise the browser keeps the old cookie and the next refresh
      // looks like token theft.
      keepalive: true,
      signal: controller.signal,
    });
    if (res.status === 401 || res.status === 403) return { ok: false, expired: true };
    if (!res.ok) return { ok: false, expired: false };
    const data = await res.json();
    if (!data?.token) return { ok: false, expired: true };
    tokenStorage.set(data.token);
    if (data.user) tokenStorage.setUser(data.user);
    return { ok: true, result: data as RefreshResult };
  } catch {
    return { ok: false, expired: false };
  } finally {
    clearTimeout(timer);
  }
}

/** Refresh the session. Concurrent callers in this tab share one request; tabs take turns. */
export function refreshSessionOutcome<U = unknown>(): Promise<RefreshOutcome<U>> {
  if (!_refreshInFlight) {
    _refreshInFlight = withCrossTabLock(doRefresh).finally(() => {
      _refreshInFlight = null;
    });
  }
  return _refreshInFlight as Promise<RefreshOutcome<U>>;
}

/**
 * Refresh the session. Resolves null when the session is over; throws
 * SessionUnavailableError when the server couldn't be reached (the session may be fine).
 */
export async function refreshSession<U = unknown>(): Promise<RefreshResult<U> | null> {
  const outcome = await refreshSessionOutcome<U>();
  if (outcome.ok) return outcome.result;
  if (outcome.expired) return null;
  throw new SessionUnavailableError();
}

// ─── AppError ────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
    /**
     * Machine-readable code from the response body (`{ code: "..." }`), when
     * the backend sends one. Needed wherever a single HTTP status covers more
     * than one case — e.g. 409 is both ALREADY_RENTED and CHECKOUT_IN_PROGRESS.
     */
    public readonly code?: string,
    /**
     * The parsed error body, for endpoints that return structured context next to
     * the message — e.g. DEAL_EXISTS carries `existingDealId`.
     */
    public readonly body?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** The session couldn't be renewed right now (offline, timeout, 429, 5xx). Not a logout. */
export class SessionUnavailableError extends AppError {
  constructor() {
    super(null, "Connection problem. Check your internet and try again.", "SESSION_REFRESH_UNAVAILABLE");
    this.name = "SessionUnavailableError";
  }
}

// ─── Core fetch wrapper ──────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | null;
  _retry?: boolean;
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { body, _retry, ...rest } = opts;

  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers as Record<string, string>),
  };

  let serialisedBody: BodyInit | null | undefined;
  if (body instanceof FormData) {
    serialisedBody = body;
  } else if (body != null) {
    headers["Content-Type"] = "application/json";
    serialisedBody = JSON.stringify(body);
  }

  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers,
    body: serialisedBody,
  });

  const isAuthEntryPath =
    path.includes("/user/login") ||
    path.includes("/user/register") ||
    path.includes("/user/google") ||
    path.includes("/user/forgot-password") ||
    path.includes("/user/reset-password") ||
    path.includes("/user/verify-email-otp") ||
    path.includes("/user/resend");

  if (res.status === 401 && !_retry && !isAuthEntryPath) {
    if (path.includes("/user/refresh")) {
      _onUnauthorized?.();
      throw new AppError(401, "Session expired. Please log in.");
    }

    // The token was renewed while this request was in flight (e.g. it went out
    // before the page-load session restore finished) — just retry with it.
    const current = tokenStorage.get();
    if (current && current !== token) {
      return apiFetch<T>(path, { ...opts, _retry: true });
    }

    // Only the caller that started the refresh fires the unauthorized handler, so a
    // burst of concurrent 401s logs out once rather than once per request.
    const startedRefresh = _refreshInFlight === null;
    const outcome = await refreshSessionOutcome();
    if (outcome.ok) {
      return apiFetch<T>(path, { ...opts, _retry: true });
    }
    if (!outcome.expired) throw new SessionUnavailableError();
    if (startedRefresh) _onUnauthorized?.();
    throw new AppError(401, "Session expired. Please log in.");
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    let code: string | undefined;
    let body: Record<string, unknown> | undefined;
    try {
      const err = await res.json();
      // Joi validation failures come back as a generic "Validation failed" with
      // the real reason in details[] — surface that instead of hiding it.
      const detail = Array.isArray(err.details) ? err.details[0]?.message : undefined;
      msg = (typeof detail === "string" && detail) || err.error || err.message || msg;
      if (typeof err.code === "string") code = err.code;
      if (err && typeof err === "object") body = err as Record<string, unknown>;
    } catch {}
    throw new AppError(res.status, msg, code, body);
  }

  return res.json() as Promise<T>;
}

// ─── HTTP helpers ─────────────────────────────────────────────

export const api = {
  get<T>(path: string, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "GET" });
  },
  post<T>(path: string, body?: Record<string, unknown> | FormData, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "POST", body: body as FetchOptions["body"] });
  },
  put<T>(path: string, body?: Record<string, unknown>, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "PUT", body: body as FetchOptions["body"] });
  },
  patch<T>(path: string, body?: Record<string, unknown>, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "PATCH", body: body as FetchOptions["body"] });
  },
  delete<T>(path: string, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "DELETE" });
  },
};

// ─── Proactive refresh ────────────────────────────────────────

const REFRESH_BEFORE_EXPIRY_MS = 60_000;
const MIN_REFRESH_AFTER_MS = 30_000;
const RETRY_AFTER_FAILURE_MS = 30_000;
const MAX_TIMER_MS = 2_147_483_647;

/**
 * The token's lifetime from its own iat/exp claims. Scheduling off the lifetime and
 * the local arrival time (not exp vs. Date.now()) keeps a wrong device clock from
 * causing either expired tokens or a refresh loop.
 */
export function tokenLifetimeMs(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const { iat, exp } = JSON.parse(atob(b64)) as { iat?: unknown; exp?: unknown };
    return typeof iat === "number" && typeof exp === "number" && exp > iat ? (exp - iat) * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Keep the access token fresh while the user is signed in: renew it a minute before
 * it expires, retry quietly after a transient failure, and check again whenever the
 * tab regains focus or the connection returns (background timers are throttled).
 * Returns a stop function.
 */
export function startSessionKeeper(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const later = (ms: number) => {
    clear();
    timer = setTimeout(() => void refreshNow(), Math.min(Math.max(ms, 0), MAX_TIMER_MS));
  };

  /** ms until this tab's token should be renewed, or null when there's nothing to renew. */
  const dueIn = (): number | null => {
    const token = tokenStorage.get();
    if (!token) return null;
    const lifetime = tokenLifetimeMs(token);
    if (lifetime == null) return null;
    const renewAfter = Math.max(lifetime - REFRESH_BEFORE_EXPIRY_MS, Math.min(MIN_REFRESH_AFTER_MS, lifetime / 2));
    return renewAfter - (Date.now() - tokenStorage.receivedAt());
  };

  const scheduleNext = () => {
    const due = dueIn();
    if (due == null) clear();
    else later(due);
  };

  async function refreshNow() {
    clear();
    if (stopped || !tokenStorage.get()) return;
    const outcome = await refreshSessionOutcome();
    if (stopped || outcome.ok) return; // on success the token listener schedules the next renewal
    if (outcome.expired) {
      _onUnauthorized?.();
      return;
    }
    later(RETRY_AFTER_FAILURE_MS);
  }

  const onWake = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const due = dueIn();
    if (due != null && due <= 0) void refreshNow();
    else scheduleNext();
  };

  const unsubscribe = tokenStorage.subscribe(() => {
    if (!stopped) scheduleNext();
  });
  window.addEventListener("focus", onWake);
  window.addEventListener("online", onWake);
  document.addEventListener("visibilitychange", onWake);
  scheduleNext();

  return () => {
    stopped = true;
    clear();
    unsubscribe();
    window.removeEventListener("focus", onWake);
    window.removeEventListener("online", onWake);
    document.removeEventListener("visibilitychange", onWake);
  };
}
