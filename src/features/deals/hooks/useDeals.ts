"use client";
/**
 * Deal Hooks — Wecinema Marketplace
 *
 * useDeals        — My Deals list with counts + stats (debounced search)
 * useDeal         — single deal, refetched when the tab regains focus
 * useDealActions  — accept / counter / decline / withdraw with stale-state recovery
 * useDealPayment  — payment-intent → Stripe → confirm for an accepted deal
 *
 * Loading flags are derived from "which request has resolved" rather than set
 * synchronously inside effects, so a fetch never triggers a cascading render.
 */

import { useCallback, useEffect, useState } from "react";
import { AppError } from "@/features/auth/services/apiClient";
import { toast } from "@/lib/toast";
import * as dealService from "../api/deal.service";
import type {
  Deal,
  DealCounts,
  DealFilter,
  DealPagination,
  DealStats,
  DealTerms,
} from "../types/deal.types";

// ─── Errors ──────────────────────────────────────────────────

/** Codes meaning "what you're looking at is out of date" — refetch after showing them. */
const STALE_CODES = new Set(["STALE_DEAL", "NOT_YOUR_TURN", "DEAL_CLOSED", "INVALID_STATE"]);

export function isStaleDealError(err: unknown): boolean {
  return err instanceof AppError && !!err.code && STALE_CODES.has(err.code);
}

export function dealErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof AppError)) return fallback;
  switch (err.code) {
    case "STALE_DEAL":          return "This deal changed while you were viewing it. The latest terms are loaded.";
    case "NOT_YOUR_TURN":       return "You're waiting on the other party to respond.";
    case "DEAL_CLOSED":         return "This deal is no longer open.";
    case "INVALID_STATE":       return "That action isn't available for this deal anymore.";
    case "NO_CHANGES":          return "Change at least one term before sending a counter offer.";
    case "OWN_LISTING":         return "You can't make an offer on your own listing.";
    case "SELLER_NOT_PAYABLE":  return "This seller can't receive payments yet. Please try again later.";
    case "LISTING_UNAVAILABLE": return "This listing is no longer available.";
    case "MAX_PROPOSALS":       return "This negotiation has reached the maximum number of offers.";
    case "DEAL_EXISTS":         return "You already have an open deal on this listing.";
    case "PAYMENT_MISMATCH":
    case "PAYMENT_NOT_AUTHORIZED":
      return "We couldn't verify that payment. No charge was captured. Please try again.";
  }
  if (err.status === 429) return "Too many requests. Please wait a moment and try again.";
  return err.message || fallback;
}

// ─── useDeals ────────────────────────────────────────────────

interface DealsResult {
  key: string;
  items: Deal[];
  counts: DealCounts | null;
  stats: DealStats | null;
  pagination: DealPagination | null;
  error: string | null;
}

export function useDeals(params: { status: DealFilter; q: string; page?: number }) {
  const { status, q, page = 1 } = params;
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [reloadKey, setReloadKey]   = useState(0);
  const [result, setResult]         = useState<DealsResult | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const requestKey = `${status}|${debouncedQ}|${page}|${reloadKey}`;

  useEffect(() => {
    // Superseded requests (fast chip switching / typing) are ignored on arrival.
    let cancelled = false;
    dealService
      .listDeals({ status, q: debouncedQ, page, limit: 20 })
      .then((res) => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          items: res.data ?? [],
          counts: res.meta?.counts ?? null,
          stats: res.meta?.stats ?? null,
          pagination: res.meta?.pagination ?? null,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult((prev) => ({
          key: requestKey,
          items: prev?.items ?? [],
          counts: prev?.counts ?? null,
          stats: prev?.stats ?? null,
          pagination: prev?.pagination ?? null,
          error: dealErrorMessage(err, "Failed to load deals"),
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, status, debouncedQ, page]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);
  const current = result?.key === requestKey;

  return {
    items: result?.items ?? [],
    counts: result?.counts ?? null,
    stats: result?.stats ?? null,
    pagination: result?.pagination ?? null,
    loading: !current,
    error: current ? result.error : null,
    refetch,
  };
}

// ─── useDeal ─────────────────────────────────────────────────

interface DealResult {
  id: string;
  deal: Deal | null;
  error: string | null;
  notFound: boolean;
}

export function useDeal(id: string | undefined) {
  const [result, setResult] = useState<DealResult | null>(null);

  const applyError = useCallback(
    (forId: string, err: unknown) =>
      // A failed background refresh keeps the deal already on screen.
      setResult((prev) =>
        prev?.id === forId && prev.deal
          ? prev
          : {
              id: forId,
              deal: null,
              error: dealErrorMessage(err, "Failed to load deal"),
              notFound: err instanceof AppError && err.status === 404,
            },
      ),
    [],
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    dealService
      .getDeal(id)
      .then((res) => {
        if (!cancelled) setResult({ id, deal: res.data, error: null, notFound: false });
      })
      .catch((err) => {
        if (!cancelled) applyError(id, err);
      });
    return () => {
      cancelled = true;
    };
  }, [id, applyError]);

  /** Imperative reload (event handlers, stale-state recovery). Never shows a spinner. */
  const refetch = useCallback(async (): Promise<Deal | null> => {
    if (!id) return null;
    try {
      const res = await dealService.getDeal(id);
      setResult({ id, deal: res.data, error: null, notFound: false });
      return res.data;
    } catch (err) {
      applyError(id, err);
      return null;
    }
  }, [id, applyError]);

  const setDeal = useCallback(
    (deal: Deal) => {
      if (id) setResult({ id, deal, error: null, notFound: false });
    },
    [id],
  );

  // The other party may act while this tab is in the background.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch]);

  const current = !!id && result?.id === id;

  return {
    deal: current ? result.deal : null,
    setDeal,
    loading: !!id && !current,
    error: current ? result.error : null,
    notFound: current ? result.notFound : false,
    refetch,
  };
}

// ─── useDealActions ──────────────────────────────────────────

export type DealAction = "accept" | "counter" | "decline" | "cancel";

export function useDealActions(
  deal: Deal | null,
  onUpdated: (deal: Deal) => void,
  refetch: () => Promise<unknown>,
) {
  const [busy, setBusy] = useState<DealAction | null>(null);

  const run = useCallback(
    async (action: DealAction, call: (d: Deal) => Promise<{ data: Deal }>, successMsg: string) => {
      if (!deal || busy) return null;
      setBusy(action);
      try {
        const res = await call(deal);
        onUpdated(res.data);
        toast.success(successMsg);
        return res.data;
      } catch (err) {
        toast.error(dealErrorMessage(err, "Something went wrong. Please try again."));
        if (isStaleDealError(err)) await refetch();
        return null;
      } finally {
        setBusy(null);
      }
    },
    [deal, busy, onUpdated, refetch],
  );

  const accept = useCallback(
    () => run("accept", (d) => dealService.acceptDeal(d._id, { expectedProposalCount: d.proposalCount }), "Offer accepted"),
    [run],
  );

  const counter = useCallback(
    (terms: DealTerms) =>
      run("counter", (d) => dealService.counterDeal(d._id, { terms, expectedProposalCount: d.proposalCount }), "Counter offer sent"),
    [run],
  );

  const decline = useCallback(
    (reason?: string) =>
      run(
        "decline",
        (d) => dealService.declineDeal(d._id, { expectedProposalCount: d.proposalCount, ...(reason ? { reason } : {}) }),
        "Offer declined",
      ),
    [run],
  );

  const cancel = useCallback(
    (reason?: string) => run("cancel", (d) => dealService.cancelDeal(d._id, reason ? { reason } : {}), "Deal withdrawn"),
    [run],
  );

  return { busy, accept, counter, decline, cancel };
}

// ─── useDealPayment ──────────────────────────────────────────

export function useDealPayment(dealId: string | undefined) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [starting, setStarting]         = useState(false);

  const start = useCallback(async () => {
    if (!dealId) return null;
    setStarting(true);
    try {
      const res = await dealService.createDealPaymentIntent(dealId);
      if (res.data.testMode) {
        // Test-payment account: no Stripe — confirm the fake payment straight away.
        await dealService.confirmDealPayment(dealId, res.data.paymentIntentId);
        toast.success("Test payment complete. No real money was charged");
        return res.data;
      }
      setClientSecret(res.data.clientSecret);
      return res.data;
    } catch (err) {
      toast.error(dealErrorMessage(err, "Could not start payment. Please try again."));
      return null;
    } finally {
      setStarting(false);
    }
  }, [dealId]);

  const reset = useCallback(() => setClientSecret(null), []);

  return { clientSecret, starting, start, reset };
}
