/**
 * Pure formatting / derivation helpers for deals. No React, no I/O — unit tested.
 */

import {
  DEAL_TYPES,
  DELIVERY_MATERIALS,
  EXCLUSIVITY,
  PAYMENT_TYPES,
  RIGHTS,
  TERRITORIES,
  type DealOption,
} from "./constants";
import type {
  Deal,
  DealChatMessageMeta,
  DealEvent,
  DealRole,
  DealStatus,
  DealTerms,
  ProposalKind,
} from "../types/deal.types";

// ─── Chat messages ───────────────────────────────────────────

const DEAL_EVENTS: DealEvent[] = [
  "offer", "counter", "revised", "accepted", "declined", "cancelled", "paid", "completed", "expired",
];

/**
 * Narrow untrusted Firestore message metadata to a deal event. Chat documents are
 * client-writable, so anything malformed is rendered as a plain message instead.
 */
export function parseDealMeta(metadata: unknown): DealChatMessageMeta | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  if (typeof m.dealId !== "string" || !/^[a-f0-9]{24}$/i.test(m.dealId)) return null;
  if (typeof m.event !== "string" || !DEAL_EVENTS.includes(m.event as DealEvent)) return null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return {
    dealId: m.dealId,
    event: m.event as DealEvent,
    actorId: str(m.actorId),
    actorName: str(m.actorName),
    actorRole: m.actorRole === "seller" ? "seller" : "buyer",
    amountCents: num(m.amountCents),
    dealType: str(m.dealType),
    territory: str(m.territory),
    termMonths: num(m.termMonths),
    dealStatus: (str(m.dealStatus) || "pending") as DealStatus,
    listingTitle: str(m.listingTitle),
  };
}

// ─── Money ───────────────────────────────────────────────────

export function formatCents(cents: number | null | undefined, opts: { compact?: boolean } = {}): string {
  const dollars = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    // Whole-dollar deal amounts read cleaner without ".00" (mockup: "$15,000").
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
    ...(opts.compact ? { notation: "compact" } : {}),
  }).format(dollars);
}

/** Dollars typed into a form → integer cents. Returns NaN for unparseable input. */
export function dollarsToCents(input: string | number): number {
  const n = typeof input === "number" ? input : Number(String(input).replace(/[,$\s]/g, ""));
  if (!Number.isFinite(n)) return Number.NaN;
  return Math.round(n * 100);
}

export function centsToDollarsInput(cents: number): string {
  if (!cents) return "";
  const d = cents / 100;
  return Number.isInteger(d) ? String(d) : d.toFixed(2);
}

// ─── Labels ──────────────────────────────────────────────────

function lookup(options: DealOption[], value: string | undefined, short = false): string {
  if (!value) return "-";
  const opt = options.find((o) => o.value === value);
  if (!opt) return value.replace(/_/g, " ");
  return short ? opt.short ?? opt.label : opt.label;
}

export const dealTypeLabel     = (v?: string) => lookup(DEAL_TYPES, v);
export const rightsLabel       = (v?: string, short = false) => lookup(RIGHTS, v, short);
export const territoryLabel    = (v?: string, short = false) => lookup(TERRITORIES, v, short);
export const exclusivityLabel  = (v?: string) => lookup(EXCLUSIVITY, v);
export const paymentTypeLabel  = (v?: string, short = false) => lookup(PAYMENT_TYPES, v, short);
export const deliveryLabel     = (v?: string) => lookup(DELIVERY_MATERIALS, v);

export function termLabel(months: number | null | undefined): string {
  if (months == null) return "-";
  if (months === 0) return "Perpetual";
  return `${months} month${months === 1 ? "" : "s"}`;
}

// ─── Status ──────────────────────────────────────────────────

export interface StatusMeta {
  label: string;
  badgeClass: string;
}

const STATUS_META: Record<DealStatus, StatusMeta> = {
  pending:     { label: "Awaiting Response", badgeClass: "mp-badge-accent" },
  negotiating: { label: "Negotiating",       badgeClass: "mp-badge-accent" },
  accepted:    { label: "Accepted",          badgeClass: "mp-badge-info" },
  paid:        { label: "In Escrow",         badgeClass: "mp-badge-info" },
  completed:   { label: "Completed",         badgeClass: "mp-badge-success" },
  declined:    { label: "Declined",          badgeClass: "mp-badge-danger" },
  cancelled:   { label: "Withdrawn",         badgeClass: "mp-badge-default" },
  expired:     { label: "Expired",           badgeClass: "mp-badge-default" },
};

export function statusMeta(status: DealStatus | string | undefined): StatusMeta {
  return STATUS_META[status as DealStatus] ?? { label: String(status ?? "Unknown"), badgeClass: "mp-badge-default" };
}

export const OPEN_NEGOTIATION: DealStatus[] = ["pending", "negotiating"];

export function isNegotiationOpen(status: DealStatus): boolean {
  return OPEN_NEGOTIATION.includes(status);
}

/** Server sends isMyTurn; this recomputes it client-side for chat cards and stale lists. */
export function isMyTurn(deal: Pick<Deal, "status" | "lastProposalBy">, userId: string | undefined): boolean {
  if (!userId) return false;
  return isNegotiationOpen(deal.status) && String(deal.lastProposalBy) !== String(userId);
}

export function viewerRole(deal: Pick<Deal, "buyer" | "seller">, userId: string | undefined): DealRole | null {
  if (!userId) return null;
  if (deal.buyer._id === userId) return "buyer";
  if (deal.seller._id === userId) return "seller";
  return null;
}

export function counterparty(deal: Pick<Deal, "buyer" | "seller" | "viewerRole">) {
  return deal.viewerRole === "buyer" ? deal.seller : deal.buyer;
}

// ─── Proposal copy ───────────────────────────────────────────

export function proposalTitle(kind: ProposalKind): string {
  switch (kind) {
    case "initial": return "Initial Offer";
    case "counter": return "Counter Offer";
    case "revised": return "Revised Offer";
  }
}

/** "Scottmurr (Buyer) made an offer" — matches the Offer History mockup. */
export function proposalDescription(kind: ProposalKind, name: string, role: DealRole): string {
  const who = `${name} (${role === "buyer" ? "Buyer" : "Creator"})`;
  switch (kind) {
    case "initial": return `${who} made an offer`;
    case "counter": return `${who} sent a counter offer`;
    case "revised": return `${who} submitted a revised offer`;
  }
}

/** The kind the *next* proposal from this role will be. */
export function nextProposalKind(role: DealRole): ProposalKind {
  return role === "seller" ? "counter" : "revised";
}

/** One-line activity summary shown on My Deals cards. */
export function lastActivityText(
  deal: Pick<Deal, "status" | "lastProposalBy" | "proposalCount" | "buyer" | "seller">,
  userId: string | undefined,
): string {
  switch (deal.status) {
    case "completed": return "Agreement finalized";
    case "paid":      return "Payment secured in escrow";
    case "accepted":  return "Offer accepted, awaiting payment";
    case "declined":  return "Deal declined";
    case "cancelled": return "Deal withdrawn";
    case "expired":   return "Deal expired";
  }
  const mine = !!userId && String(deal.lastProposalBy) === String(userId);
  const isFirst = deal.proposalCount <= 1;
  if (mine) return isFirst ? "You sent an offer" : "You sent a counter offer";
  const otherName =
    String(deal.lastProposalBy) === deal.buyer._id ? deal.buyer.username : deal.seller.username;
  return isFirst ? `${otherName} sent an offer` : `${otherName} sent a counter offer`;
}

// ─── Dates ───────────────────────────────────────────────────

/** "Jun 30, 2024 • 3:22 PM" */
export function formatDealDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} • ${time}`;
}

// ─── Terms ───────────────────────────────────────────────────

const TERM_KEYS: (keyof DealTerms)[] = [
  "amountCents", "currency", "dealType", "rights", "territory",
  "termMonths", "exclusivity", "paymentType", "deliveryMaterials", "notes",
];

export function normalizeTerms(t: DealTerms): DealTerms {
  return {
    amountCents: Math.round(Number(t.amountCents) || 0),
    currency: "USD",
    dealType: t.dealType,
    rights: t.rights,
    territory: t.territory,
    termMonths: Number(t.termMonths),
    exclusivity: t.exclusivity,
    paymentType: t.paymentType,
    deliveryMaterials: t.deliveryMaterials,
    notes: (t.notes ?? "").trim(),
  };
}

export function termsEqual(a: DealTerms, b: DealTerms): boolean {
  const na = normalizeTerms(a);
  const nb = normalizeTerms(b);
  return TERM_KEYS.every((k) => na[k] === nb[k]);
}
