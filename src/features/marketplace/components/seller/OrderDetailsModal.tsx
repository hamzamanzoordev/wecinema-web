"use client";
/**
 * OrderDetailsModal — Wecinema Marketplace (Seller)
 *
 * FIX: formatCurrency(orderDetails.amount) was missing /100 — amount is in cents.
 * FIX: updateStatus was calling the admin-only /status endpoint — now uses
 *      correct seller endpoints via useOrderDetails hook.
 * FIX: "Shipping Address" section replaced with relevant delivery info.
 * FIX: paymentMethod field (doesn't exist on orders) replaced with real fields.
 * FIX: Added platform fee / seller payout breakdown.
 * FIX: Status options aligned to what sellers can actually do.
 */

import React, { useCallback, useState } from "react";
import {
  AlertCircle, CheckCircle2, ChevronRight, Clock,
  Loader2, MessageCircle, RefreshCw, RotateCcw,
  Send, Settings, Star, Truck, X, XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';

import { useOrderDetails } from '@/hooks/Useorderdetails';

// ─── Types ────────────────────────────────────────────────────

interface OrderDetailsModalProps {
  orderId:        string;
  isOpen:         boolean;
  onClose:        () => void;
  onOrderUpdate?: (orderId: string, newStatus: string) => void;
}

// Status → target action the seller takes
interface StatusAction {
  label:       string;
  targetStatus: string;       // passed to updateStatus()
  Icon:        React.FC<{ size?: number; className?: string }>;
  color:       "green" | "blue" | "yellow";
  description: string;
}

// ─── Constants ────────────────────────────────────────────────

// Statuses where seller can still cancel
const CANCELLABLE = new Set(["pending_payment", "paid", "processing"]);

// Statuses where work has begun (no cancel)
const WORK_STARTED = new Set([
  "in_progress", "delivered", "in_revision", "completed",
]);

// Seller actions per current status
const SELLER_ACTIONS: Partial<Record<string, StatusAction>> = {
  paid: {
    label: "Start Processing", targetStatus: "processing",
    Icon: Settings, color: "blue",
    description: "Mark order as processing before starting work.",
  },
  processing: {
    label: "Start Work", targetStatus: "in_progress",
    Icon: Truck, color: "green",
    description: "Begin working on the deliverables.",
  },
};

// ─── Helpers ──────────────────────────────────────────────────

/** Amount is stored in CENTS in the DB — always divide by 100 to display */
function fmtMoney(cents: number | undefined | null): string {
  if (cents == null || isNaN(cents)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Listing price is stored in DOLLARS by the seller */
function fmtPrice(dollars: number | undefined | null): string {
  if (dollars == null || isNaN(dollars)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2,
  }).format(dollars);
}

function fmtDate(d?: string): string {
  if (!d) return "N/A";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "N/A"; }
}

function fmtStatus(s?: string): string {
  if (!s) return "N/A";
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function statusColorClass(status?: string): string {
  const s = status ?? "";
  if (["completed", "paid", "delivered"].includes(s))         return "bg-success-bg text-success";
  if (["pending_payment", "pending", "in_revision"].includes(s)) return "bg-warning-bg text-warning";
  if (["processing", "in_progress"].includes(s))              return "bg-info-bg text-info";
  if (["cancelled", "failed", "disputed"].includes(s))        return "bg-danger-bg text-danger";
  return "bg-bg-secondary text-text-secondary";
}

function progressClass(status: string): string {
  switch (status) {
    case "processing":  return "w-1/4 bg-blue-500";
    case "in_progress": return "w-1/2 bg-yellow-500";
    case "delivered":   return "w-3/4 bg-green-500";
    case "in_revision": return "w-3/5 bg-orange-500";
    case "completed":   return "w-full bg-green-600";
    default:            return "w-1/6 bg-gray-400";
  }
}

function avatarInitial(name?: string, fallback = "?"): string {
  return name?.charAt(0).toUpperCase() ?? fallback;
}

// ─── Sub-components ───────────────────────────────────────────

const SectionCard: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <div className={`bg-bg-secondary border border-border rounded-2xl p-4 ${className}`}>
    {title && (
      <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
        {title}
      </h3>
    )}
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4 py-2 border-b border-border last:border-0 text-sm">
    <span className="text-text-tertiary flex-shrink-0">{label}</span>
    <span className="font-medium text-text-primary text-right max-w-[60%]">{value}</span>
  </div>
);

const ConfirmDialog: React.FC<{
  message:   string;
  onConfirm: () => void;
  onClose:   () => void;
}> = ({ message, onConfirm, onClose }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-card-bg rounded-2xl shadow-2xl p-5 max-w-xs w-full border border-border"
      onClick={(e) => e.stopPropagation()}
    >
      <AlertCircle size={28} className="text-warning mx-auto mb-3" />
      <p className="text-sm text-text-secondary text-center mb-4 leading-relaxed">{message}</p>
      <div className="flex gap-2">
        <button
          type="button" onClick={onClose}
          className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          No, keep it
        </button>
        <button
          type="button" onClick={() => { onConfirm(); onClose(); }}
          className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-btn-primary-text rounded-xl text-sm font-bold transition-colors"
        >
          Yes, proceed
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onOrderUpdate,
}) => {
  const router = useRouter();

  const { orderDetails, loading, error, refetch, updateStatus, updating } =
    useOrderDetails(orderId, isOpen);

  const [activeTab,     setActiveTab]     = useState<"status" | "info" | "payment">("status");
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);

  const handleAction = useCallback(async (action: StatusAction) => {
    const ok = await updateStatus(action.targetStatus);
    if (ok) {
      toast.success(`${action.label} successful`);
      onOrderUpdate?.(orderId, action.targetStatus);
    } else {
      toast.error(`${action.label} failed. Please try again`);
    }
    setPendingAction(null);
  }, [updateStatus, orderId, onOrderUpdate]);

  const handleCancelOrder = useCallback(async () => {
    const ok = await updateStatus("cancelled");
    if (ok) {
      toast.success("Order cancelled");
      onOrderUpdate?.(orderId, "cancelled");
    } else {
      toast.error("Failed to cancel order");
    }
    setPendingAction(null);
  }, [updateStatus, orderId, onOrderUpdate]);

  if (!isOpen) return null;

  const sellerAction = orderDetails ? SELLER_ACTIONS[orderDetails.status] ?? null : null;
  const canCancelOrder = orderDetails ? CANCELLABLE.has(orderDetails.status) : false;
  const workHasStarted = orderDetails ? WORK_STARTED.has(orderDetails.status) : false;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{   opacity: 0, y: 16,  scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              className="relative bg-modal-bg rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col border border-border"
              style={{ maxHeight: "calc(100vh - 2rem)" }}
            >
              {/* ── Header ── */}
              <div className="flex-shrink-0 border-b border-border px-5 pt-4 pb-0">
                <div className="flex items-start justify-between gap-3 pb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-text-primary">
                      Order #{orderDetails?.orderNumber ?? orderId.slice(-8).toUpperCase()}
                    </h3>
                    {orderDetails && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColorClass(orderDetails.status)}`}>
                          {fmtStatus(orderDetails.status)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          workHasStarted
                            ? "bg-danger-bg text-danger"
                            : canCancelOrder
                            ? "bg-success-bg text-success"
                            : "bg-bg-secondary text-text-tertiary"
                        }`}>
                          {workHasStarted ? "Work Started" : canCancelOrder ? "Cancellable" : "Not Cancellable"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button" onClick={refetch} disabled={loading}
                      className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-secondary disabled:opacity-40 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { onClose(); router.push(`/marketplace/orders/${orderId}`); }}
                      className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                      title="Open full details page"
                    >
                      <Send size={15} />
                    </button>
                    <button
                      type="button" onClick={onClose}
                      className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex">
                  {(["status", "info", "payment"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={[
                        "flex-1 py-2.5 text-sm font-semibold capitalize transition-colors relative",
                        activeTab === tab
                          ? "text-accent"
                          : "text-text-tertiary hover:text-text-secondary",
                      ].join(" ")}
                    >
                      {tab === "status" ? "Actions" : tab === "info" ? "Details" : "Payment"}
                      {activeTab === tab && (
                        <motion.div
                          layoutId="modal-tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Body ── */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <Loader2 size={28} className="animate-spin text-accent" />
                    <p className="text-sm text-text-tertiary">Loading order details…</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-danger-bg flex items-center justify-center">
                      <XCircle size={22} className="text-danger" />
                    </div>
                    <p className="text-sm font-medium text-text-secondary">{error}</p>
                    <button
                      type="button" onClick={refetch}
                      className="px-4 py-2 bg-accent text-btn-primary-text rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : orderDetails ? (
                  <div className="space-y-4">

                    {/* ══ ACTIONS TAB ═════════════════════════ */}
                    {activeTab === "status" && (
                      <>
                        {/* Amount summary card */}
                        <SectionCard>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-text-tertiary mb-1">Order Amount</p>
                              <p className="text-2xl font-extrabold text-success tabular-nums">
                                {fmtMoney(orderDetails.amount)}
                              </p>
                              {orderDetails.sellerAmount != null && (
                                <p className="text-xs text-text-secondary mt-1">
                                  Your payout: <span className="font-semibold text-success">{fmtMoney(orderDetails.sellerAmount)}</span>
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-text-tertiary mb-1">Order Date</p>
                              <p className="text-sm font-medium text-text-primary">
                                {fmtDate(orderDetails.createdAt)}
                              </p>
                              {orderDetails.expectedDelivery && (
                                <>
                                  <p className="text-xs text-text-tertiary mt-2 mb-0.5">Expected Delivery</p>
                                  <p className="text-xs font-medium text-warning">{fmtDate(orderDetails.expectedDelivery)}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </SectionCard>

                        {/* Work-in-progress warning */}
                        {workHasStarted && (
                          <div className="flex items-start gap-2.5 bg-warning-bg border border-accent/30 rounded-xl p-3.5">
                            <AlertCircle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-warning">Work In Progress</p>
                              <p className="text-xs text-warning mt-0.5">
                                This order cannot be cancelled. Use the Deliver button once work is done.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Seller primary action */}
                        {sellerAction && (
                          <SectionCard title="Next Step">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-info-bg flex items-center justify-center flex-shrink-0">
                                <sellerAction.Icon size={16} className="text-info" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-primary">{sellerAction.label}</p>
                                <p className="text-xs text-text-secondary mt-0.5">{sellerAction.description}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPendingAction(sellerAction)}
                              disabled={updating}
                              className={[
                                "w-full mt-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 text-white",
                                sellerAction.color === "green" ? "bg-green-600 hover:bg-green-700" :
                                sellerAction.color === "blue"  ? "bg-blue-600 hover:bg-blue-700"  :
                                                                 "bg-yellow-500 hover:bg-yellow-600",
                                updating ? "opacity-60 cursor-wait" : "",
                              ].join(" ")}
                            >
                              {updating ? <Loader2 size={13} className="animate-spin" /> : <sellerAction.Icon size={13} />}
                              {updating ? "Updating…" : sellerAction.label}
                            </button>
                          </SectionCard>
                        )}

                        {/* In-progress: deliver prompt */}
                        {(orderDetails.status === "in_progress" || orderDetails.status === "in_revision") && (
                          <SectionCard title={orderDetails.status === "in_revision" ? "Revision Required" : "Deliver Work"}>
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-9 h-9 rounded-xl bg-success-bg flex items-center justify-center flex-shrink-0">
                                {orderDetails.status === "in_revision"
                                  ? <RotateCcw size={16} className="text-success" />
                                  : <Send size={16} className="text-success" />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">
                                  {orderDetails.status === "in_revision" ? "Submit your revision" : "Send completed work to buyer"}
                                </p>
                                <p className="text-xs text-text-secondary mt-0.5">
                                  Use the Orders tab to attach files and add a delivery message.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => { onClose(); router.push(`/marketplace/orders/${orderId}`); }}
                              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Send size={13} /> Open Delivery Form
                            </button>
                          </SectionCard>
                        )}

                        {/* Delivered: awaiting buyer */}
                        {orderDetails.status === "delivered" && (
                          <SectionCard>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-success-bg flex items-center justify-center flex-shrink-0">
                                <Clock size={16} className="text-success" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">Awaiting Buyer Review</p>
                                <p className="text-xs text-text-secondary mt-0.5">
                                  Delivered on {fmtDate(orderDetails.deliveredAt)}. Buyer will accept or request revisions.
                                </p>
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {/* Completed */}
                        {orderDetails.status === "completed" && (
                          <SectionCard>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-success-bg flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 size={16} className="text-success" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-success">Order Completed</p>
                                <p className="text-xs text-text-secondary mt-0.5">
                                  Completed {fmtDate(orderDetails.completedAt)}.
                                  {orderDetails.paymentReleased && " Payment has been released to your account."}
                                </p>
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {/* Cancelled */}
                        {orderDetails.status === "cancelled" && (
                          <SectionCard>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-danger-bg flex items-center justify-center flex-shrink-0">
                                <XCircle size={16} className="text-danger" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-danger">Order Cancelled</p>
                                {orderDetails.cancelReason && (
                                  <p className="text-xs text-text-secondary mt-0.5">{orderDetails.cancelReason}</p>
                                )}
                                <p className="text-xs text-text-tertiary mt-1">{fmtDate(orderDetails.cancelledAt)}</p>
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {/* Cancel order */}
                        {canCancelOrder && (
                          <button
                            type="button"
                            onClick={() => setPendingAction({ label: "Cancel Order", targetStatus: "cancelled", Icon: XCircle, color: "yellow", description: "" })}
                            disabled={updating}
                            className="w-full py-2.5 border border-danger/30 text-danger bg-danger-bg hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            <XCircle size={14} /> Cancel This Order
                          </button>
                        )}

                        {/* Progress bar */}
                        {WORK_STARTED.has(orderDetails.status) && (
                          <SectionCard title="Work Progress">
                            <div className="flex items-center justify-between mb-2 text-xs">
                              <span className="text-text-tertiary">Progress</span>
                              <span className="font-semibold text-text-primary">{fmtStatus(orderDetails.status)}</span>
                            </div>
                            <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: undefined }}
                                className={`h-full rounded-full transition-all duration-700 ${progressClass(orderDetails.status)}`}
                              />
                            </div>
                            {orderDetails.revisions != null && (
                              <p className="text-xs text-text-tertiary mt-2">
                                Revisions: {orderDetails.revisions} / {orderDetails.maxRevisions ?? "∞"}
                              </p>
                            )}
                          </SectionCard>
                        )}

                        {/* Listing */}
                        <SectionCard title="Listing">
                          <InfoRow label="Title"    value={orderDetails.listingId?.title ?? "N/A"} />
                          <InfoRow label="Listed At" value={fmtPrice(orderDetails.listingId?.price)} />
                          <InfoRow label="Category" value={orderDetails.listingId?.category ?? "N/A"} />
                          <InfoRow label="Type"     value={orderDetails.listingId?.type ?? "N/A"} />
                          {orderDetails.listingId?.description && (
                            <p className="text-xs text-text-tertiary mt-2 line-clamp-2 leading-relaxed">
                              {orderDetails.listingId.description}
                            </p>
                          )}
                          {orderDetails.listingId?.tags && orderDetails.listingId.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {orderDetails.listingId.tags.slice(0, 5).map((tag) => (
                                <span key={tag} className="bg-bg-secondary text-text-secondary text-xs px-2 py-0.5 rounded-full border border-border">
                                  {tag}
                                </span>
                              ))}
                              {orderDetails.listingId.tags.length > 5 && (
                                <span className="text-text-tertiary text-xs self-center">
                                  +{orderDetails.listingId.tags.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </SectionCard>
                      </>
                    )}

                    {/* ══ DETAILS TAB ═════════════════════════ */}
                    {activeTab === "info" && (
                      <>
                        {/* Buyer / Seller */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <SectionCard title="Buyer">
                            <div className="flex items-center gap-3 mb-3">
                              {orderDetails.buyerId?.avatar ? (
                                <img
                                  src={orderDetails.buyerId.avatar}
                                  alt={orderDetails.buyerId.username}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                                  {avatarInitial(orderDetails.buyerId?.username, "B")}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-text-primary truncate">
                                  {orderDetails.buyerId?.username ?? "Unknown"}
                                </p>
                                <p className="text-xs text-text-tertiary truncate">
                                  {orderDetails.buyerId?.email}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => router.push(`/marketplace/messages?user=${orderDetails.buyerId?._id}`)}
                              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                              <MessageCircle size={13} /> Message Buyer
                            </button>
                          </SectionCard>

                          <SectionCard title="Seller (You)">
                            <div className="flex items-center gap-3">
                              {orderDetails.sellerId?.avatar ? (
                                <img
                                  src={orderDetails.sellerId.avatar}
                                  alt={orderDetails.sellerId.username}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                                  {avatarInitial(orderDetails.sellerId?.username, "S")}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-text-primary">
                                  {orderDetails.sellerId?.username ?? "Unknown"}
                                </p>
                                {orderDetails.sellerId?.sellerRating != null && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs text-text-tertiary">
                                      {orderDetails.sellerId.sellerRating.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </SectionCard>
                        </div>

                        {/* Order info */}
                        <SectionCard title="Order Information">
                          <InfoRow label="Order ID"    value={<span className="font-mono text-xs">{orderDetails._id}</span>} />
                          <InfoRow label="Type"        value={fmtStatus(orderDetails.orderType)} />
                          <InfoRow label="Created"     value={fmtDate(orderDetails.createdAt)} />
                          <InfoRow label="Updated"     value={fmtDate(orderDetails.updatedAt)} />
                          {orderDetails.paidAt       && <InfoRow label="Paid"      value={fmtDate(orderDetails.paidAt)} />}
                          {orderDetails.deliveredAt  && <InfoRow label="Delivered" value={fmtDate(orderDetails.deliveredAt)} />}
                          {orderDetails.completedAt  && <InfoRow label="Completed" value={fmtDate(orderDetails.completedAt)} />}
                          {orderDetails.cancelledAt  && <InfoRow label="Cancelled" value={fmtDate(orderDetails.cancelledAt)} />}
                        </SectionCard>

                        {/* Requirements / notes */}
                        {[
                          { label: "Requirements",  text: orderDetails.requirements },
                          { label: "Buyer Notes",   text: orderDetails.buyerNotes },
                          { label: "Seller Notes",  text: orderDetails.sellerNotes },
                        ].filter(n => n.text).map(({ label, text }) => (
                          <SectionCard key={label} title={label}>
                            <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
                          </SectionCard>
                        ))}

                        {/* Offer details */}
                        {orderDetails.offerId && (
                          <SectionCard title="Offer Details">
                            {orderDetails.offerId.message && (
                              <InfoRow label="Message" value={orderDetails.offerId.message} />
                            )}
                            {orderDetails.offerId.requirements && (
                              <InfoRow label="Requirements" value={orderDetails.offerId.requirements} />
                            )}
                            {orderDetails.offerId.expectedDelivery && (
                              <InfoRow label="Expected Delivery" value={orderDetails.offerId.expectedDelivery} />
                            )}
                          </SectionCard>
                        )}

                        {/* Delivery info */}
                        {orderDetails.deliveryMessage && (
                          <SectionCard title="Delivery Message">
                            <p className="text-sm text-text-secondary leading-relaxed">{orderDetails.deliveryMessage}</p>
                          </SectionCard>
                        )}
                        {orderDetails.deliveryFiles && orderDetails.deliveryFiles.length > 0 && (
                          <SectionCard title={`Delivered Files (${orderDetails.deliveryFiles.length})`}>
                            <div className="space-y-2">
                              {orderDetails.deliveryFiles.map((f, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-text-secondary truncate">{f}</span>
                                  <a
                                    href={`/marketplace/orders/upload/delivery/${f}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="ml-2 text-xs text-accent hover:text-accent-hover flex-shrink-0"
                                  >
                                    Download
                                  </a>
                                </div>
                              ))}
                            </div>
                          </SectionCard>
                        )}
                      </>
                    )}

                    {/* ══ PAYMENT TAB ═════════════════════════ */}
                    {activeTab === "payment" && (
                      <>
                        {/* Payment breakdown */}
                        <SectionCard title="Payment Breakdown">
                          <div className="space-y-3">
                            {/* Total */}
                            <div className="flex justify-between items-center p-3 bg-card-bg rounded-xl border border-border">
                              <div>
                                <p className="text-xs text-text-tertiary">Total Paid by Buyer</p>
                                <p className="text-xl font-extrabold text-text-primary tabular-nums">
                                  {fmtMoney(orderDetails.amount)}
                                </p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColorClass(orderDetails.paymentStatus)}`}>
                                {fmtStatus(orderDetails.paymentStatus)}
                              </span>
                            </div>

                            {/* Fee breakdown */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                <p className="text-xs text-red-500 dark:text-red-400 mb-1">Platform Fee (10%)</p>
                                <p className="text-base font-bold text-red-600 dark:text-red-400 tabular-nums">
                                  {orderDetails.platformFee != null
                                    ? fmtMoney(orderDetails.platformFee)
                                    : fmtMoney(Math.floor(orderDetails.amount * 0.1))}
                                </p>
                              </div>
                              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Your Payout</p>
                                <p className="text-base font-bold text-green-700 dark:text-green-400 tabular-nums">
                                  {orderDetails.sellerAmount != null
                                    ? fmtMoney(orderDetails.sellerAmount)
                                    : fmtMoney(Math.floor(orderDetails.amount * 0.9))}
                                </p>
                              </div>
                            </div>

                            <p className="text-xs text-text-tertiary text-center">
                              Payout is released after buyer accepts delivery.
                              {orderDetails.paymentReleased && (
                                <span className="text-green-600 dark:text-green-400 font-semibold"> Payment has been released.</span>
                              )}
                            </p>
                          </div>
                        </SectionCard>

                        {/* Payment status details */}
                        <SectionCard title="Payment Status">
                          <InfoRow label="Status"  value={
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColorClass(orderDetails.paymentStatus)}`}>
                              {fmtStatus(orderDetails.paymentStatus)}
                            </span>
                          } />
                          <InfoRow label="Released" value={
                            orderDetails.paymentReleased
                              ? <span className="text-success flex items-center gap-1"><CheckCircle2 size={12} /> Released</span>
                              : <span className="text-text-tertiary">Pending</span>
                          } />
                          {orderDetails.paidAt && (
                            <InfoRow label="Paid On" value={fmtDate(orderDetails.paidAt)} />
                          )}
                          {orderDetails.completedAt && (
                            <InfoRow label="Completed" value={fmtDate(orderDetails.completedAt)} />
                          )}
                        </SectionCard>

                        {/* Stripe info */}
                        {orderDetails.stripePaymentIntentId && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-1">
                                Stripe Payment Intent
                              </p>
                              <p className="text-xs font-mono text-purple-500 dark:text-purple-400 truncate">
                                {orderDetails.stripePaymentIntentId}
                              </p>
                            </div>
                            <a
                              href={`https://dashboard.stripe.com/payments/${orderDetails.stripePaymentIntentId}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                              View in Stripe
                            </a>
                          </div>
                        )}
                        {orderDetails.stripeTransferId && (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                                Stripe Transfer
                              </p>
                              <p className="text-xs font-mono text-green-600 dark:text-green-400 truncate">
                                {orderDetails.stripeTransferId}
                              </p>
                            </div>
                            <a
                              href={`https://dashboard.stripe.com/transfers/${orderDetails.stripeTransferId}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                              View Transfer
                            </a>
                          </div>
                        )}
                      </>
                    )}

                  </div>
                ) : null}
              </div>

              {/* ── Footer ── */}
              <div className="flex-shrink-0 border-t border-border px-5 py-3 flex items-center justify-between gap-3">
                <button
                  type="button" onClick={onClose}
                  className="px-4 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-medium hover:bg-bg-secondary transition-colors"
                >
                  Close
                </button>
                <div className="flex gap-2">
                  {orderDetails?.buyerId && (
                    <button
                      type="button"
                      onClick={() => router.push("/marketplace/messages")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      <MessageCircle size={14} /> Contact Buyer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { onClose(); router.push(`/marketplace/orders/${orderId}`); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-btn-primary-text rounded-xl text-sm font-bold transition-colors"
                  >
                    <Send size={14} /> Full Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm dialog ── */}
      {pendingAction && (
        <ConfirmDialog
          message={
            pendingAction.targetStatus === "cancelled"
              ? "Are you sure you want to cancel this order? This cannot be undone."
              : `Confirm: ${pendingAction.label}?`
          }
          onConfirm={() =>
            pendingAction.targetStatus === "cancelled"
              ? handleCancelOrder()
              : handleAction(pendingAction)
          }
          onClose={() => setPendingAction(null)}
        />
      )}
    </>
  );
};

export default OrderDetailsModal;
