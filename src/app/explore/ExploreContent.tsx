"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
  FUNDING,
} from "@paypal/react-paypal-js";
import {
  CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe,
} from "@stripe/react-stripe-js";
import type { StripeElementStyle } from "@stripe/stripe-js";
import Link from "next/link";
import Image from "next/image";
import { SiAmericanexpress, SiVisa } from "react-icons/si";
import {
  AlertCircle, ArrowLeft, CalendarClock, Check, CheckCircle2, CreditCard, Film,
  Loader2, Lock, LogOut, RefreshCw, ShieldCheck, Sparkles, Wallet,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AppError, api } from "@/features/auth/services/apiClient";
import { FullScreenSpinner } from "@/components/auth/shared";
import { trackSubscription, trackBeginCheckout } from "@/lib/analytics/track";
import { getStripePromise, STRIPE_APPEARANCE } from "@/features/payments/stripeClient";

// ─── Types ─────────────────────────────────────────────────────

type UserMode = "buyer" | "seller";
type PlanId = "user" | "studio";

interface SubscriptionStatus {
  hasPaid: boolean;
  isExpired: boolean;
  subscriptionType: string | null;
  userType: string | null;
}

interface CreateOrderResponse { orderId: string }
interface CaptureOrderResponse { success: boolean; message: string }

// ─── Payment API ───────────────��───────────────────────────────

async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  return api.get<SubscriptionStatus>(`/payments/status/${userId}`);
}

async function fetchPaypalClientId(): Promise<string> {
  try {
    const data = await api.get<{ paypalClientId?: string }>("/payments/config");
    return data?.paypalClientId ?? "";
  } catch { return ""; }
}

async function createOrder(planId: PlanId, userType: UserMode): Promise<string> {
  const res = await api.post<CreateOrderResponse>("/payments/create-order", { planId, userType });
  if (!res?.orderId) throw new Error("No order ID received from server");
  return res.orderId;
}

async function captureOrder(orderId: string): Promise<CaptureOrderResponse> {
  return api.post<CaptureOrderResponse>("/payments/capture-order", { orderId });
}

/** Test accounts: the backend skips PayPal, so the plan goes with the capture. */
async function captureTestOrder(orderId: string, planId: PlanId, userType: UserMode): Promise<CaptureOrderResponse> {
  return api.post<CaptureOrderResponse>("/payments/capture-order", { orderId, planId, userType });
}

interface CardIntentResponse { clientSecret: string; paymentIntentId: string; amountCents: number }

async function createCardIntent(planId: PlanId, userType: UserMode): Promise<CardIntentResponse> {
  const res = await api.post<CardIntentResponse>("/payments/stripe/create-intent", { planId, userType });
  if (!res?.clientSecret) throw new Error("Could not start card payment");
  return res;
}

async function confirmCardPayment(paymentIntentId: string): Promise<CaptureOrderResponse> {
  return api.post<CaptureOrderResponse>("/payments/stripe/confirm", { paymentIntentId });
}

// ─── Static data ───────────────────────────────────────────────

const PLANS = [
  {
    id: "user" as PlanId,
    name: "Basic",
    title: "Basic Plan",
    price: "$5/month",
    amount: 5,
    description: "For individual buyers and creators.",
    highlighted: false,
    features: ["Buy films & scripts", "Sell your content", "Community access", "5GB storage", "Standard support"],
  },
  {
    id: "studio" as PlanId,
    name: "Pro",
    title: "Pro Plan",
    price: "$10/month",
    amount: 10,
    description: "For studios and high-volume creators.",
    highlighted: true,
    features: ["Everything in Basic", "Early feature access", "Team collaboration", "Priority support"],
  },
];

// ─── Shared UI ─────────────────────────────────────────────────

const primaryButton: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
  background: "var(--color-accent-primary)", color: "#000",
  fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "none",
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: "transparent", color: "var(--color-text-primary)",
  border: "1px solid var(--color-border-secondary)",
};

const textLink: React.CSSProperties = {
  background: "transparent", border: "none", padding: 0,
  color: "var(--color-text-tertiary)", fontSize: 13, cursor: "pointer", textDecoration: "none",
};

const payButton: React.CSSProperties = {
  marginTop: 20, padding: "14px 0", fontSize: 15, fontWeight: 700,
  boxShadow: "0 6px 20px color-mix(in srgb, var(--color-accent-primary) 35%, transparent)",
};

const panel: React.CSSProperties = {
  background: "var(--color-bg-elevated)", borderRadius: 18,
  border: "1px solid var(--color-border-secondary)",
  boxShadow: "0 1px 2px var(--color-shadow), 0 12px 32px var(--color-shadow)",
};

const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;

/** Above the site header (100) and nav drawer; below the cookie and test-mode banners (9998+). */
const CHECKOUT_Z = 9000;

/**
 * Distraction-free frame for checkout: it covers the site header, sidebar and
 * bottom nav from the route layout, leaving only the logo and a log-out link.
 */
function CheckoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authUser, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // The page underneath would otherwise scroll along with the checkout.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally { router.push("/"); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: CHECKOUT_Z, overflowY: "auto", background: "var(--color-bg-secondary)", color: "var(--color-text-primary)" }}>
      <header
        style={{
          position: "sticky", top: 0, zIndex: 1, height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          padding: "0 clamp(16px,4vw,32px)",
          background: "color-mix(in srgb, var(--color-bg-elevated) 92%, transparent)",
          backdropFilter: "blur(8px)", borderBottom: "1px solid var(--color-border-secondary)",
        }}
      >
        <Link href="/" aria-label="WeCinema home" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Image src="/wecinema.webp" alt="" width={32} height={28} priority style={{ objectFit: "contain" }} />
          <span style={{ fontSize: "1.0625rem", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            WeCinema
          </span>
        </Link>
        {authUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span className="hidden sm:inline" style={{ fontSize: 13, color: "var(--color-text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>
              Signed in as <strong style={{ color: "var(--color-text-secondary)" }}>{authUser.username || authUser.email}</strong>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9999,
                fontSize: 13, fontWeight: 600, cursor: loggingOut ? "wait" : "pointer",
                border: "1px solid var(--color-border-primary)", background: "var(--color-bg-elevated)", color: "var(--color-text-primary)",
              }}
            >
              <LogOut size={14} aria-hidden /> {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        )}
      </header>
      <main style={{ paddingTop: 24 }}>{children}</main>
    </div>
  );
}

/** Plans run 30 days from payment and don't auto-renew (see the expiry cron). */
const accessUntil = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

function InlineAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, padding: "10px 12px",
        borderRadius: 10, fontSize: 13, lineHeight: 1.45,
        background: "var(--color-danger-bg)", color: "var(--color-danger)",
        border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)",
      }}
    >
      <AlertCircle size={16} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  );
}

function PaymentSkeleton({ label }: { label: string }) {
  const bar = (h: number, w = "100%"): React.CSSProperties => ({
    height: h, width: w, borderRadius: 10, background: "var(--color-skeleton-base)",
  });
  return (
    <div role="status" aria-live="polite">
      <div className="animate-pulse" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={bar(14, "30%")} />
        <div style={bar(46)} />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={bar(46)} />
          <div style={bar(46)} />
        </div>
        <div style={{ ...bar(50), marginTop: 8 }} />
      </div>
      <p style={{ margin: "14px 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "var(--color-text-tertiary)" }}>
        <Loader2 size={14} className="animate-spin" aria-hidden /> {label}
      </p>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value, options, onChange, label,
}: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{
        display: "flex", padding: 4, gap: 4, borderRadius: 10,
        background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-secondary)",
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1, padding: "8px 16px", borderRadius: 7, border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              transition: "background 0.15s, color 0.15s",
              background: active ? "var(--color-bg-elevated)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ErrorDialog({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: CHECKOUT_Z + 1 }} onClick={onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Payment error"
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: CHECKOUT_Z + 2, background: "var(--color-bg-elevated)", borderRadius: 16, padding: 24, maxWidth: 380, width: "calc(100% - 32px)", border: "1px solid var(--color-border-secondary)" }}
      >
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 16px", textAlign: "center", lineHeight: 1.5 }}>{message}</p>
        <button type="button" autoFocus onClick={onClose} style={primaryButton}>Close</button>
      </div>
    </>
  );
}

function StatusIcon() {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: "50%", marginBottom: 20,
      background: "color-mix(in srgb, var(--color-success) 14%, transparent)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <CheckCircle2 size={28} color="var(--color-success)" aria-hidden />
    </div>
  );
}

// ─── PayPal inner buttons ──────────────────────────────────────

function PayPalButtonsInner({
  userId, planId, userType, onSuccess, onError,
}: {
  userId: string; planId: PlanId; userType: UserMode;
  onSuccess: () => void; onError: (msg: string) => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (isPending) return <PaymentSkeleton label="Loading PayPal…" />;
  if (isRejected) return (
    <p style={{ textAlign: "center", color: "var(--color-danger)", fontSize: 13 }}>
      Could not load PayPal. Please reload the page.
    </p>
  );
  if (err) return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 8 }}>{err}</p>
      <button
        onClick={() => setErr(null)}
        style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "var(--color-danger)", color: "#fff", fontSize: 13, cursor: "pointer" }}
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div style={{ position: "relative", minHeight: 50 }}>
      {processing && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 10, fontSize: 13, color: "var(--color-text-secondary)" }}>
          <Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} /> Processing…
        </div>
      )}
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", label: "pay", height: 45 }}
        disabled={processing}
        fundingSource={FUNDING.PAYPAL}
        createOrder={async () => {
          setProcessing(true);
          setErr(null);
          try {
            return await createOrder(planId, userType);
          } catch (e) {
            setProcessing(false);
            const msg = e instanceof Error ? e.message : "Failed to create order.";
            setErr(msg);
            onError(msg);
            throw e;
          }
        }}
        onApprove={async (data) => {
          try {
            if (!data.orderID) throw new Error("No order ID from PayPal");
            const result = await captureOrder(data.orderID);
            setProcessing(false);
            if (result.success) onSuccess();
            else { setErr("Payment not completed. Please try again."); onError("Payment not completed."); }
          } catch (e) {
            setProcessing(false);
            const msg = e instanceof Error ? e.message : "Payment failed.";
            setErr(msg);
            onError(msg);
          }
        }}
        onCancel={() => setProcessing(false)}
        onError={(e) => {
          setProcessing(false);
          console.error("PayPal error:", e);
          setErr("PayPal error. Please disable popup blockers and try again.");
        }}
        onClick={(_d, actions) => {
          if (!userId || processing) return actions.reject();
          return actions.resolve();
        }}
      />
    </div>
  );
}

// ─── PayPal wrapper (fetches client ID) ─────���─────────────────

function TestPaymentButton({
  planId, userType, onSuccess, onError,
}: {
  planId: PlanId; userType: UserMode;
  onSuccess: () => void; onError: (msg: string) => void;
}) {
  const [processing, setProcessing] = useState(false);

  const pay = async () => {
    setProcessing(true);
    try {
      const orderId = await createOrder(planId, userType);
      const result = await captureTestOrder(orderId, planId, userType);
      if (result?.success) onSuccess();
      else onError(result?.message || "Test payment failed.");
    } catch (e) {
      onError(e instanceof AppError ? e.message : "Test payment failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <p style={{ margin: "0 0 12px", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(245,158,11,0.12)", color: "#B45309", border: "1px solid rgba(245,158,11,0.35)" }}>
        TEST MODE: no real payment will be taken.
      </p>
      <button
        type="button"
        onClick={pay}
        disabled={processing}
        style={{ ...primaryButton, cursor: processing ? "wait" : "pointer", opacity: processing ? 0.7 : 1 }}
      >
        {processing ? "Processing…" : "Complete test payment"}
      </button>
    </div>
  );
}

// ─── Stripe card payment (debit / credit) ──────────────────────

type CardFieldName = "number" | "expiry" | "cvc";

/**
 * Stripe's card fields render in iframes, so they can't read our CSS variables.
 * Resolve them here so the text matches the current light/dark theme.
 */
function themedCardStyle(): StripeElementStyle {
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const dark = root.getAttribute("data-theme") === "dark";
  return {
    base: {
      color: token("--color-text-primary", dark ? "#F0F0F0" : "#0F0F0F"),
      fontFamily: STRIPE_APPEARANCE.variables.fontFamily,
      fontSize: "15px",
      fontSmoothing: "antialiased",
      iconColor: token("--color-text-tertiary", "#6F6F6F"),
      "::placeholder": { color: token("--color-input-placeholder", "#9E9EA0") },
    },
    invalid: { color: token("--color-danger", "#DC2626"), iconColor: token("--color-danger", "#DC2626") },
  };
}

function CardField({
  id, label, focused, invalid, children,
}: {
  id: string; label: string; focused: boolean; invalid: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label htmlFor={id} style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)" }}>
        {label}
      </label>
      <div
        id={id}
        style={{
          padding: "13px 14px", borderRadius: 10, background: "var(--color-input-bg)",
          transition: "border-color 0.15s, box-shadow 0.15s",
          border: `1px solid ${invalid ? "var(--color-danger)" : focused ? "var(--color-accent-primary)" : "var(--color-input-border)"}`,
          boxShadow: focused ? "0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 20%, transparent)" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CardForm({
  planId, clientSecret, paymentIntentId, onSuccess,
}: {
  planId: PlanId; clientSecret: string; paymentIntentId: string; onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<CardFieldName | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CardFieldName, string>>>({});
  const [style] = useState(themedCardStyle);
  const plan = PLANS.find((p) => p.id === planId)!;

  const track = (name: CardFieldName) => ({
    onFocus: () => setFocused(name),
    onBlur: () => setFocused((f) => (f === name ? null : f)),
    onChange: (e: { error?: { message: string } }) =>
      setFieldErrors((prev) => ({ ...prev, [name]: e.error?.message })),
    onLoadError: () => setError("Could not load the card form. Please reload the page."),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    const card = elements.getElement(CardNumberElement);
    if (!card) return;

    setSubmitting(true);
    setError(null);

    // Card only, so 3D Secure opens in a Stripe modal rather than a redirect.
    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (confirmError || paymentIntent?.status !== "succeeded") {
      setError(confirmError?.message ?? "Payment failed. Please try another card.");
      setSubmitting(false);
      return;
    }

    // Charged. Activate now rather than waiting on the webhook; the backend
    // ignores a payment it has already applied, so both paths are safe.
    try {
      await confirmCardPayment(paymentIntentId);
    } catch {
      // The webhook will still activate it.
    }
    onSuccess();
  }

  const fieldError = fieldErrors.number ?? fieldErrors.expiry ?? fieldErrors.cvc;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <CardField id="card-number" label="Card number" focused={focused === "number"} invalid={!!fieldErrors.number}>
          <CardNumberElement options={{ style, showIcon: true, placeholder: "1234 1234 1234 1234" }} {...track("number")} />
        </CardField>
        <div style={{ display: "flex", gap: 12 }}>
          <CardField id="card-expiry" label="Expiry date" focused={focused === "expiry"} invalid={!!fieldErrors.expiry}>
            <CardExpiryElement options={{ style, placeholder: "MM / YY" }} {...track("expiry")} />
          </CardField>
          <CardField id="card-cvc" label="Security code" focused={focused === "cvc"} invalid={!!fieldErrors.cvc}>
            <CardCvcElement options={{ style, placeholder: "CVC" }} {...track("cvc")} />
          </CardField>
        </div>
      </div>
      {(error ?? fieldError) && <InlineAlert message={(error ?? fieldError)!} />}
      <button
        type="submit"
        disabled={!stripe || submitting}
        style={{ ...primaryButton, ...payButton, cursor: submitting ? "wait" : "pointer", opacity: !stripe || submitting ? 0.7 : 1 }}
      >
        {submitting
          ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Processing payment…</>
          : <><Lock size={15} aria-hidden /> Pay {formatUsd(plan.amount)}</>}
      </button>
    </form>
  );
}

function StripeCardPayment({
  planId, userType, onSuccess,
}: {
  planId: PlanId; userType: UserMode; onSuccess: () => void;
}) {
  const [intent, setIntent] = useState<CardIntentResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Parent keys this component on plan + user type, so state starts fresh.
    let cancelled = false;
    createCardIntent(planId, userType)
      .then((res) => { if (!cancelled) setIntent(res); })
      .catch((e) => { if (!cancelled) setLoadError(e instanceof Error ? e.message : "Could not start card payment."); });
    return () => { cancelled = true; };
  }, [planId, userType]);

  if (loadError) return <InlineAlert message={loadError} />;
  if (!intent) return <PaymentSkeleton label="Setting up secure checkout…" />;

  return (
    <Elements stripe={getStripePromise()}>
      <CardForm planId={planId} clientSecret={intent.clientSecret} paymentIntentId={intent.paymentIntentId} onSuccess={onSuccess} />
    </Elements>
  );
}

type PayMethod = "card" | "paypal";

function CardBrands() {
  // Card marks sit on white tiles in both themes, like the printed logos.
  const tile: React.CSSProperties = {
    width: 38, height: 24, borderRadius: 4, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid #E2E2E4", background: "#FFFFFF",
  };
  return (
    <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
      <span style={tile} role="img" aria-label="Visa">
        <SiVisa size={26} color="#1434CB" aria-hidden />
      </span>
      <span style={tile} role="img" aria-label="Mastercard">
        <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden>
          <circle cx="8" cy="8" r="8" fill="#EB001B" />
          <circle cx="18" cy="8" r="8" fill="#F79E1B" />
          <path d="M13 1.75a8 8 0 0 1 0 12.5a8 8 0 0 1 0-12.5z" fill="#FF5F00" />
        </svg>
      </span>
      <span style={tile} role="img" aria-label="American Express">
        <SiAmericanexpress size={22} color="#2E77BC" aria-hidden />
      </span>
    </span>
  );
}

function PaymentMethodPicker({ method, onChange }: { method: PayMethod; onChange: (m: PayMethod) => void }) {
  const options: { value: PayMethod; title: string; hint: string; icon: React.ReactNode; extra?: React.ReactNode }[] = [
    { value: "card", title: "Credit or debit card", hint: "Visa, Mastercard, Amex & more", icon: <CreditCard size={18} aria-hidden />, extra: <CardBrands /> },
    { value: "paypal", title: "PayPal", hint: "Pay with your PayPal balance or linked bank", icon: <Wallet size={18} aria-hidden /> },
  ];
  return (
    <div role="radiogroup" aria-label="Payment method" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
      {options.map((o) => {
        const active = o.value === method;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px",
              borderRadius: 12, cursor: "pointer", textAlign: "left",
              transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
              border: `1.5px solid ${active ? "var(--color-accent-primary)" : "var(--color-border-primary)"}`,
              background: active
                ? "color-mix(in srgb, var(--color-accent-primary) 7%, var(--color-bg-elevated))"
                : "var(--color-bg-elevated)",
              boxShadow: active ? "0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 18%, transparent)" : "none",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${active ? "var(--color-accent-primary)" : "var(--color-border-primary)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent-primary)" }} />}
            </span>
            <span style={{ color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", display: "flex", flexShrink: 0 }}>{o.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{o.title}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>{o.hint}</span>
              {o.extra && <span className="mt-2 flex sm:hidden">{o.extra}</span>}
            </span>
            {o.extra && <span className="hidden sm:flex">{o.extra}</span>}
          </button>
        );
      })}
    </div>
  );
}

function CheckoutSteps() {
  const steps = ["Plan", "Payment", "Confirmation"];
  const current = 1;
  return (
    <ol aria-label="Checkout progress" style={{ display: "flex", alignItems: "center", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} aria-current={active ? "step" : undefined} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done || active ? "var(--color-accent-primary)" : "var(--color-bg-elevated)",
                color: done || active ? "#000" : "var(--color-text-tertiary)",
                border: done || active ? "none" : "1px solid var(--color-border-primary)",
              }}
            >
              {done ? <Check size={12} strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span className={active ? undefined : "hidden sm:inline"} style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
              {s}
            </span>
            {i < steps.length - 1 && <span aria-hidden style={{ width: 24, height: 1, background: "var(--color-border-primary)" }} />}
          </li>
        );
      })}
    </ol>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, fontSize: strong ? 15 : 13 }}>
      <span style={{ color: strong ? "var(--color-text-primary)" : "var(--color-text-tertiary)", fontWeight: strong ? 600 : 400 }}>{label}</span>
      <span style={{ color: "var(--color-text-primary)", fontWeight: strong ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function OrderSummary({ planId, userType }: { planId: PlanId; userType: UserMode }) {
  const plan = PLANS.find((p) => p.id === planId)!;
  const divider = <div style={{ height: 1, background: "var(--color-border-secondary)" }} />;
  return (
    <div style={{ ...panel, padding: 24 }}>
      <h2 style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
        Order summary
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <span
          aria-hidden
          style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", color: "#000",
            background: "linear-gradient(135deg, var(--color-accent-primary), color-mix(in srgb, var(--color-accent-primary) 55%, #FF6A00))",
          }}
        >
          {plan.highlighted ? <Sparkles size={22} /> : <Film size={22} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>WeCinema {plan.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}>
              {userType === "buyer" ? "Buyer" : "Seller"}
            </span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>{plan.description}</p>
        </div>
      </div>

      <ul style={{ listStyle: "none", margin: "0 0 20px", padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--color-text-secondary)" }}>
            <Check size={15} color="var(--color-success)" aria-hidden style={{ flexShrink: 0 }} />
            {f}
          </li>
        ))}
      </ul>

      {divider}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 0" }}>
        <SummaryRow label={`${plan.title} · 30 days`} value={formatUsd(plan.amount)} />
        <SummaryRow label="Setup fee" value="Free" />
      </div>
      {divider}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 0 4px" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>Due today</span>
        <span style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          {formatUsd(plan.amount)}
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-tertiary)", marginLeft: 4 }}>USD</span>
        </span>
      </div>

      <div
        style={{
          display: "flex", gap: 10, marginTop: 16, padding: "12px 14px", borderRadius: 12,
          background: "var(--color-bg-tertiary)", fontSize: 12, lineHeight: 1.5, color: "var(--color-text-secondary)",
        }}
      >
        <CalendarClock size={16} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: "var(--color-text-tertiary)" }} />
        <span>
          Access until <strong style={{ color: "var(--color-text-primary)" }}>{accessUntil()}</strong>. No automatic renewal. We&apos;ll remind you before it ends.
        </span>
      </div>
    </div>
  );
}

function TrustBadges() {
  const items = [
    { icon: <Lock size={14} aria-hidden />, label: "256-bit SSL encryption" },
    { icon: <ShieldCheck size={14} aria-hidden />, label: "Processed by Stripe & PayPal" },
    { icon: <RefreshCw size={14} aria-hidden />, label: "No recurring charges" },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 18px", marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--color-border-secondary)" }}>
      {items.map((i) => (
        <span key={i.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-tertiary)" }}>
          {i.icon} {i.label}
        </span>
      ))}
    </div>
  );
}

function PayPalPayment({
  userId, planId, userType, testMode = false, onSuccess, onError, onSkip, onBack,
}: {
  userId: string; planId: PlanId; userType: UserMode; testMode?: boolean;
  onSuccess: () => void; onError: (msg: string) => void; onSkip: () => void; onBack: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PayMethod>("card");

  useEffect(() => {
    fetchPaypalClientId().then((id) => { setClientId(id); setLoading(false); });
  }, []);

  const plan = PLANS.find((p) => p.id === planId)!;

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "8px 16px 56px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <button type="button" onClick={onBack} style={{ ...textLink, display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
          <ArrowLeft size={15} aria-hidden /> Change plan
        </button>
        <CheckoutSteps />
      </div>

      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, fontFamily: "var(--font-heading)", lineHeight: 1.2, color: "var(--color-text-primary)" }}>
          Complete your subscription
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "var(--color-text-secondary)" }}>
          You&apos;re one step away from unlocking WeCinema {plan.name}.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <aside className="lg:sticky lg:top-6 lg:order-2" aria-label="Order summary">
          <OrderSummary planId={planId} userType={userType} />
        </aside>

        <section className="lg:order-1" aria-labelledby="payment-heading" style={{ ...panel, padding: "24px clamp(18px,4vw,32px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
            <h2 id="payment-heading" style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
              Payment details
            </h2>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--color-success)" }}>
              <Lock size={13} aria-hidden /> Secure
            </span>
          </div>

          {testMode ? (
            <TestPaymentButton planId={planId} userType={userType} onSuccess={onSuccess} onError={onError} />
          ) : (
            <>
              <PaymentMethodPicker method={method} onChange={setMethod} />
              {method === "card" ? (
                <StripeCardPayment key={`${planId}:${userType}`} planId={planId} userType={userType} onSuccess={onSuccess} />
              ) : loading ? (
                <PaymentSkeleton label="Loading payment options…" />
              ) : !clientId ? (
                <InlineAlert message="PayPal is unavailable right now. Please pay by card or contact support." />
              ) : (
                <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture", components: "buttons" }}>
                  <PayPalButtonsInner userId={userId} planId={planId} userType={userType} onSuccess={onSuccess} onError={onError} />
                </PayPalScriptProvider>
              )}
            </>
          )}

          <p style={{ margin: "16px 0 0", fontSize: 12, lineHeight: 1.55, color: "var(--color-text-tertiary)", textAlign: "center" }}>
            By completing your purchase you agree to our{" "}
            <Link href="/terms-and-conditions" style={{ color: "var(--color-text-link)" }}>Terms</Link> and{" "}
            <Link href="/privacy-policy" style={{ color: "var(--color-text-link)" }}>Privacy Policy</Link>.
            You&apos;ll be charged {formatUsd(plan.amount)} once for 30 days of access.
          </p>

          <TrustBadges />
        </section>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button type="button" onClick={onSkip} style={textLink}>Skip for now</button>
      </div>
    </div>
  );
}

// ─── Success screen ────────────────────────────────────────────

function SuccessScreen({ planId, userType }: { planId: PlanId; userType: UserMode }) {
  const plan = PLANS.find((p) => p.id === planId)!;
  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ ...panel, width: "100%", maxWidth: 440, padding: "36px 28px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <StatusIcon />
        <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          Payment successful
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          Welcome to WeCinema {plan.name}. Everything is unlocked and ready to go.
        </p>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, padding: 16, borderRadius: 12, background: "var(--color-bg-tertiary)", textAlign: "left" }}>
          <SummaryRow label="Plan" value={plan.title} />
          <SummaryRow label="Account type" value={userType === "buyer" ? "Buyer" : "Seller"} />
          <SummaryRow label="Amount paid" value={formatUsd(plan.amount)} />
          <SummaryRow label="Access until" value={accessUntil()} />
        </div>
        <p style={{ margin: "20px 0 0", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-tertiary)" }}>
          <Loader2 size={14} className="animate-spin" aria-hidden /> Taking you home…
        </p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────���────────────────────────────────

export function ExploreContent(props: { appUrl: string }) {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <ExploreContentInner {...props} />
    </Suspense>
  );
}

function ExploreContentInner({ appUrl: _appUrl }: { appUrl: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser, isAuthenticated, refreshUser } = useAuth();

  // Restore the plan and account type chosen before being redirected through login.
  const [mode, setMode] = useState<UserMode>(() => (searchParams.get("mode") === "seller" ? "seller" : "buyer"));
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(() => {
    const planParam = searchParams.get("plan");
    return planParam === "user" || planParam === "studio" ? planParam : null;
  });
  const [phase, setPhase] = useState<"plans" | "payment" | "success" | "already_premium">("plans");
  const [errorMsg, setErrorMsg] = useState("");
  const [showError, setShowError] = useState(false);

  const authCheckedRef = useRef(false);

  // If already authenticated + hasPaid, show "already premium" screen
  useEffect(() => {
    if (authCheckedRef.current) return;
    if (!isAuthenticated || !authUser?._id) return;
    authCheckedRef.current = true;

    getSubscriptionStatus(authUser._id)
      .then((status) => {
        // Test accounts are always "paid", but still need to reach checkout to test it.
        if (status.hasPaid && !status.isExpired && !authUser.isTestAccount) {
          setPhase("already_premium");
        } else if (selectedPlan && phase === "plans") {
          setPhase("payment");
        }
      })
      .catch(() => { /* treat as not paid */ });
  }, [isAuthenticated, authUser, selectedPlan, phase]);

  const handlePaymentSuccess = useCallback(async () => {
    // Fire before the redirect — the page unmounts 2.5s later.
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (plan) trackSubscription({ plan: plan.title, value: plan.amount });
    setPhase("success");
    try { await refreshUser(); } catch { /* non-critical */ }
    setTimeout(() => router.replace("/"), 2500);
  }, [router, refreshUser, selectedPlan]);

  // Returning from a 3DS card redirect: Stripe appends payment_intent and
  // redirect_status to return_url. A failed redirect just lands back on the
  // payment step (via ?plan=) so the user can retry.
  const redirectHandledRef = useRef(false);
  useEffect(() => {
    const paymentIntentId = searchParams.get("payment_intent");
    if (redirectHandledRef.current || !paymentIntentId || !isAuthenticated) return;
    if (searchParams.get("redirect_status") !== "succeeded") return;
    redirectHandledRef.current = true;
    authCheckedRef.current = true; // skip the "already premium" check; we just paid
    confirmCardPayment(paymentIntentId)
      .catch(() => { /* the webhook will still activate it */ })
      .finally(() => { handlePaymentSuccess(); });
  }, [searchParams, isAuthenticated, handlePaymentSuccess]);

  // Reaching the payment step is the checkout start.
  useEffect(() => {
    if (phase !== "payment" || !selectedPlan) return;
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (plan) trackBeginCheckout({ plan: plan.title, value: plan.amount });
  }, [phase, selectedPlan]);

  const closeError = useCallback(() => setShowError(false), []);

  // ── Already premium screen ─────────────────────────────────────
  if (phase === "already_premium") {
    return (
      <div style={{ minHeight: "70vh", backgroundColor: "var(--color-bg-tertiary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", textAlign: "center" }}>
        <StatusIcon />
        <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          You&apos;re already subscribed
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 15, color: "var(--color-text-secondary)", maxWidth: 380, lineHeight: 1.5 }}>
          Your plan is active. Premium content and all features are unlocked.
        </p>
        <div style={{ width: "100%", maxWidth: 280 }}>
          <button type="button" onClick={() => router.push("/hypemode")} style={primaryButton}>
            Go to HypeMode
          </button>
        </div>
        <button type="button" onClick={() => router.push("/")} style={{ ...textLink, marginTop: 16 }}>
          Back to home
        </button>
      </div>
    );
  }

  // ── Payment phase ──────────────────────────────────────────────
  if (phase === "payment" && selectedPlan) {
    const userId = authUser?._id ?? "";
    return (
      <CheckoutShell>
        <PayPalPayment
          userId={userId}
          planId={selectedPlan}
          userType={mode}
          testMode={!!authUser?.isTestAccount}
          onSuccess={handlePaymentSuccess}
          onError={(msg) => { setErrorMsg(msg); setShowError(true); }}
          onSkip={() => router.replace("/")}
          onBack={() => setPhase("plans")}
        />
        {showError && <ErrorDialog message={errorMsg} onClose={closeError} />}
      </CheckoutShell>
    );
  }

  // ── Success phase ──────────────────────────────────────────────
  if (phase === "success" && selectedPlan) {
    return (
      <CheckoutShell>
        <SuccessScreen planId={selectedPlan} userType={mode} />
      </CheckoutShell>
    );
  }

  // ── Plans phase ────────────────────────────────────────────────
  const choosePlan = (planId: PlanId) => {
    if (!isAuthenticated) {
      // Signed-out users sign in first; login sends them back here and the
      // ?plan= restore above takes them straight to checkout.
      const returnTo = `/pricing?plan=${planId}&mode=${mode}`;
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }
    setSelectedPlan(planId);
    setPhase("payment");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "56px 16px 48px" }}>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
            Pricing
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 700, fontFamily: "var(--font-heading)", lineHeight: 1.15, color: "var(--color-text-primary)" }}>
            Simple plans for creators and buyers
          </h1>
          <p style={{ margin: "0 auto", fontSize: 15, color: "var(--color-text-secondary)", maxWidth: 460, lineHeight: 1.6 }}>
            Watching is free. Upgrade to buy, sell and list your work. Cancel anytime.
          </p>
        </header>

        {/* Buyer / Seller toggle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 32 }}>
          <span style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>I want to…</span>
          <div style={{ width: 240 }}>
            <SegmentedControl
              label="Account type"
              value={mode}
              onChange={setMode}
              options={[{ value: "buyer", label: "Buy" }, { value: "seller", label: "Sell" }]}
            />
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id && !isAuthenticated;
            return (
              <div
                key={plan.id}
                style={{
                  flex: "1 1 300px", maxWidth: 400, display: "flex", flexDirection: "column",
                  backgroundColor: "var(--color-bg-elevated)", borderRadius: 16, padding: 24,
                  border: `1px solid ${isSelected || plan.highlighted ? "var(--color-accent-primary)" : "var(--color-border-secondary)"}`,
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>{plan.name}</h2>
                  {plan.highlighted && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 9999, color: "var(--color-text-primary)", border: "1px solid var(--color-border-secondary)" }}>
                      Most popular
                    </span>
                  )}
                </div>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--color-text-tertiary)" }}>{plan.description}</p>

                <p style={{ margin: "0 0 20px", display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 700, fontFamily: "var(--font-heading)", lineHeight: 1, color: "var(--color-text-primary)" }}>${plan.amount}</span>
                  <span style={{ fontSize: 14, color: "var(--color-text-tertiary)" }}>/ month</span>
                </p>

                <button
                  type="button"
                  onClick={() => choosePlan(plan.id)}
                  style={plan.highlighted ? primaryButton : secondaryButton}
                >
                  Choose {plan.name}
                </button>

                <ul style={{ listStyle: "none", margin: "24px 0 0", padding: "20px 0 0", borderTop: "1px solid var(--color-border-secondary)", display: "flex", flexDirection: "column", gap: 12 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--color-text-secondary)" }}>
                      <Check size={16} color="var(--color-success)" aria-hidden style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Trust row */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 24px", marginTop: 32, fontSize: 13, color: "var(--color-text-tertiary)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Lock size={14} aria-hidden /> Secure checkout via Stripe &amp; PayPal</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RefreshCw size={14} aria-hidden /> Cancel anytime</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CreditCard size={14} aria-hidden /> Billed every 30 days</span>
        </div>
      </div>

      {showError && <ErrorDialog message={errorMsg} onClose={closeError} />}
    </div>
  );
}
