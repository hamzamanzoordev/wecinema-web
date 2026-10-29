"use client";

/**
 * Rental checkout.
 *
 * Deliberately not a variant of features/marketplace/.../PaymentModal.tsx: that
 * file is 616 lines under `@ts-nocheck` and is typed against an offer/listing
 * union whose members both carry marketplace-only fields. Threading a third
 * variant through it would mean editing every branch of a file with type
 * checking switched off.
 *
 * No <AddressElement> here — a digital rental has nothing to ship, and
 * dropping it removes the entire billing-details surface.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripePromise, STRIPE_APPEARANCE } from "@/features/payments/stripeClient";
import { startRentalCheckout, confirmRental } from "../api/rental.service";
import type { RentalTerms } from "../types/rental.types";

interface RentModalProps {
  videoId: string;
  title: string;
  thumbnail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

// ─── Inner form (must live inside <Elements>) ────────────────

function RentForm({
  rentalId,
  amountCents,
  currency,
  terms,
  onSuccess,
}: {
  rentalId: string;
  amountCents: number;
  currency: string;
  terms: RentalTerms;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // redirect only if the card actually requires it (3DS); most test and
      // real cards complete inline.
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?rental=success`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try another card.");
      setSubmitting(false);
      return;
    }

    // Payment succeeded. Tell the backend now rather than waiting on webhook
    // delivery — activation is idempotent, so both paths are safe.
    try {
      await confirmRental(rentalId);
    } catch {
      // The webhook will still activate it; don't block the viewer on this.
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{ layout: "tabs" }}
        // Without this, a failure to load the card form leaves a silent blank
        // gap above the Pay button and the buyer has no idea what went wrong.
        onLoadError={(e) => {
          setError(
            e?.error?.message ??
              "Payment form failed to load. Please refresh and try again.",
          );
        }}
      />

      {error && (
        <p
          role="alert"
          style={{
            margin: "12px 0 0",
            fontSize: 13,
            color: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        style={{
          marginTop: 16,
          width: "100%",
          padding: "12px 20px",
          borderRadius: 9999,
          border: "none",
          fontWeight: 800,
          fontSize: 15,
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.7 : 1,
          background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
          color: "#000",
        }}
      >
        {submitting ? "Processing…" : `Pay ${money(amountCents, currency)}`}
      </button>

      <p
        style={{
          margin: "12px 0 0",
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--color-text-tertiary)",
          textAlign: "center",
        }}
      >
        You have {terms.windowDays} days to start watching. Once you press play,
        the film stays available for {terms.playWindowHours}{" "}
        {terms.playWindowHours === 1 ? "hour" : "hours"}.
      </p>
    </form>
  );
}

// ─── Test-account checkout (no Stripe) ───────────────────────

function TestRentForm({
  rentalId,
  amountCents,
  currency,
  onSuccess,
}: {
  rentalId: string;
  amountCents: number;
  currency: string;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete() {
    setSubmitting(true);
    setError(null);
    try {
      await confirmRental(rentalId);
      onSuccess();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Test payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p
        style={{
          margin: "0 0 12px",
          padding: "8px 10px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          background: "rgba(245,158,11,0.12)",
          color: "#B45309",
          border: "1px solid rgba(245,158,11,0.35)",
        }}
      >
        TEST MODE: no real payment will be taken.
      </p>
      {error && (
        <p role="alert" style={{ margin: "0 0 12px", fontSize: 13, color: "#ef4444" }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={complete}
        disabled={submitting}
        style={{
          width: "100%",
          padding: "12px 20px",
          borderRadius: 9999,
          border: "none",
          fontWeight: 800,
          fontSize: 15,
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.7 : 1,
          background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
          color: "#000",
        }}
      >
        {submitting ? "Processing…" : `Complete test payment (${money(amountCents, currency)})`}
      </button>
    </div>
  );
}

// ─── Shell ───────────────────────────────────────────────────

export default function RentModal({
  videoId,
  title,
  thumbnail,
  onClose,
  onSuccess,
}: RentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [rentalId, setRentalId] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState<number>(0);
  const [currency, setCurrency] = useState("USD");
  const [terms, setTerms] = useState<RentalTerms>({ windowDays: 30, playWindowHours: 48 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    // React re-runs effects in development (StrictMode). Guard so the modal
    // fires exactly one checkout — two would race to create the same pending
    // rental. Deliberately NO per-run "cancelled" flag: the cleanup between
    // StrictMode's double-invoke would then discard the only in-flight
    // response and leave the modal spinning forever. Post-unmount setState is
    // a harmless no-op in React 18+.
    if (startedRef.current) return;
    startedRef.current = true;

    startRentalCheckout(videoId)
      .then((res) => {
        setClientSecret(res.clientSecret);
        setTestMode(!!res.testMode);
        setRentalId(res.rentalId);
        setAmountCents(res.amountCents);
        setCurrency(res.currency ?? "USD");
        if (res.terms) setTerms(res.terms);
      })
      .catch((err: { status?: number; message?: string; code?: string }) => {
        // They already hold this rental — treat as success so the player
        // refreshes into the entitled state rather than showing an error.
        // Note 409 alone isn't enough: CHECKOUT_IN_PROGRESS shares that status.
        if (err?.code === "ALREADY_RENTED") {
          onSuccess();
          return;
        }
        setLoadError(err?.message ?? "Could not start checkout. Please try again.");
      });
  }, [videoId, onSuccess]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Rent ${title}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 16,
          backgroundColor: "var(--color-bg-primary)",
          border: "1px solid var(--color-border-secondary)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
          {thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt=""
              style={{ width: 88, height: 50, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>
              Renting
            </p>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 15,
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
              color: "var(--color-text-tertiary)",
            }}
          >
            ×
          </button>
        </div>

        {loadError && (
          <p role="alert" style={{ fontSize: 14, color: "#ef4444" }}>
            {loadError}
          </p>
        )}

        {testMode && rentalId && (
          <TestRentForm
            rentalId={rentalId}
            amountCents={amountCents}
            currency={currency}
            onSuccess={onSuccess}
          />
        )}

        {!loadError && !clientSecret && !testMode && (
          <p style={{ fontSize: 14, color: "var(--color-text-tertiary)" }}>
            Setting up secure checkout…
          </p>
        )}

        {clientSecret && rentalId && (
          <Elements
            stripe={getStripePromise()}
            options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
          >
            <RentForm
              rentalId={rentalId}
              amountCents={amountCents}
              currency={currency}
              terms={terms}
              onSuccess={onSuccess}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
