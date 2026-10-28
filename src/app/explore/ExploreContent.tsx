"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
  FUNDING,
} from "@paypal/react-paypal-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ArrowLeft, Check, CheckCircle2, CreditCard, Loader2, Lock, RefreshCw } from "lucide-react";
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
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} onClick={onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Payment error"
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 51, background: "var(--color-bg-elevated)", borderRadius: 16, padding: 24, maxWidth: 380, width: "calc(100% - 32px)", border: "1px solid var(--color-border-secondary)" }}
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

  if (isPending) return <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading PayPal…</p>;
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
        TEST MODE — no real payment will be taken.
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

function CardForm({
  planId, paymentIntentId, onSuccess,
}: {
  planId: PlanId; paymentIntentId: string; onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const plan = PLANS.find((p) => p.id === planId)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your card details.");
      setSubmitting(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      // Only redirects when the card requires it (3DS). The return is handled
      // by the payment_intent query param check in ExploreContentInner.
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?plan=${planId}`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try another card.");
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

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{ layout: "tabs" }}
        onLoadError={() => setError("Could not load the card form. Please reload the page.")}
      />
      {error && <p style={{ margin: "10px 0 0", color: "var(--color-danger)", fontSize: 13 }}>{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        style={{ ...primaryButton, marginTop: 16, cursor: submitting ? "wait" : "pointer", opacity: !stripe || submitting ? 0.7 : 1 }}
      >
        {submitting ? "Processing…" : <><Lock size={14} aria-hidden /> Pay ${plan.amount}</>}
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

  if (loadError) return <p style={{ textAlign: "center", color: "var(--color-danger)", fontSize: 13 }}>{loadError}</p>;
  if (!intent) return <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>Setting up secure checkout…</p>;

  return (
    <Elements stripe={getStripePromise()} options={{ clientSecret: intent.clientSecret, appearance: STRIPE_APPEARANCE }}>
      <CardForm planId={planId} paymentIntentId={intent.paymentIntentId} onSuccess={onSuccess} />
    </Elements>
  );
}

function PaymentMethodToggle({ method, onChange }: { method: "paypal" | "card"; onChange: (m: "paypal" | "card") => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <SegmentedControl
        label="Payment method"
        value={method}
        onChange={onChange}
        options={[{ value: "paypal", label: "PayPal" }, { value: "card", label: "Debit / Credit card" }]}
      />
    </div>
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

function PayPalPayment({
  userId, planId, userType, testMode = false, onSuccess, onError, onSkip, onBack,
}: {
  userId: string; planId: PlanId; userType: UserMode; testMode?: boolean;
  onSuccess: () => void; onError: (msg: string) => void; onSkip: () => void; onBack: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<"paypal" | "card">("paypal");

  useEffect(() => {
    fetchPaypalClientId().then((id) => { setClientId(id); setLoading(false); });
  }, []);

  const plan = PLANS.find((p) => p.id === planId)!;

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px 16px 48px" }}>
      <button type="button" onClick={onBack} style={{ ...textLink, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <ArrowLeft size={14} aria-hidden /> Change plan
      </button>

      <div style={{
        background: "var(--color-bg-elevated)", borderRadius: 16, padding: 24,
        border: "1px solid var(--color-border-secondary)",
      }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          Checkout
        </h2>

        <div style={{
          display: "flex", flexDirection: "column", gap: 10, padding: 16, marginBottom: 20,
          borderRadius: 12, background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-secondary)",
        }}>
          <SummaryRow label="Plan" value={plan.title} />
          <SummaryRow label="Account type" value={userType === "buyer" ? "Buyer" : "Seller"} />
          <SummaryRow label="Billing period" value="30 days" />
          <div style={{ height: 1, background: "var(--color-border-secondary)", margin: "4px 0" }} />
          <SummaryRow label="Total" value={<>${plan.amount}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-tertiary)" }}> / month</span></>} strong />
        </div>

        {testMode ? (
          <TestPaymentButton planId={planId} userType={userType} onSuccess={onSuccess} onError={onError} />
        ) : (
          <>
            <PaymentMethodToggle method={method} onChange={setMethod} />
            {method === "card" ? (
              <StripeCardPayment key={`${planId}:${userType}`} planId={planId} userType={userType} onSuccess={onSuccess} />
            ) : loading ? (
          <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading payment options…</p>
        ) : !clientId ? (
          <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>Payment not configured. Contact support.</p>
        ) : (
          <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture", components: "buttons" }}>
            <PayPalButtonsInner userId={userId} planId={planId} userType={userType} onSuccess={onSuccess} onError={onError} />
          </PayPalScriptProvider>
            )}
          </>
        )}

        <p style={{ margin: "16px 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--color-text-tertiary)" }}>
          <Lock size={12} aria-hidden /> Payments are encrypted and processed by PayPal &amp; Stripe
        </p>
      </div>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button type="button" onClick={onSkip} style={textLink}>Skip for now</button>
      </div>
    </div>
  );
}

// ─── Success screen ────────────────────────────────────────────

function SuccessScreen({ planId, userType }: { planId: PlanId; userType: UserMode }) {
  const plan = PLANS.find((p) => p.id === planId)!;
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
      <StatusIcon />
      <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
        You&apos;re all set
      </h2>
      <p style={{ margin: "0 0 8px", fontSize: 15, color: "var(--color-text-secondary)" }}>
        Your {plan.title} is active ({userType === "buyer" ? "Buyer" : "Seller"} account).
      </p>
      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)" }}>Redirecting you home…</p>
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
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-tertiary)", color: "var(--color-text-primary)", paddingTop: 24 }}>
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
      </div>
    );
  }

  // ── Success phase ──────────────────────────────────────────────
  if (phase === "success" && selectedPlan) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-tertiary)" }}>
        <SuccessScreen planId={selectedPlan} userType={mode} />
      </div>
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
