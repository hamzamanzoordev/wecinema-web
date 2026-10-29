"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import {
  FaArrowLeft, FaCheckCircle, FaTimesCircle, FaSpinner,
  FaRedo, FaBan, FaPlay, FaCog, FaPaperPlane, FaComment,
  FaSync, FaPrint,
} from 'react-icons/fa';
import {
  FiPackage, FiClock, FiDollarSign, FiUser,
  FiAlertTriangle, FiCheck, FiList,
} from 'react-icons/fi';

import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import { useAuth } from '@/features/auth/context/AuthContext';
import { api } from '@/features/auth/services/apiClient';

// ─── Types ────────────────────────────────────────────────────

interface OrderParty {
  _id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  sellerRating?: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  listingId?: { _id: string; title?: string; description?: string; category?: string; type?: string } | string;
  buyerId?: OrderParty;
  sellerId?: OrderParty;
  amount: number;
  platformFee?: number;
  sellerAmount?: number;
  status: string;
  paymentStatus: string;
  orderType?: string;
  requirements?: string;
  buyerNotes?: string;
  sellerNotes?: string;
  deliveryMessage?: string;
  deliveryFiles?: string[];
  revisions?: number;
  maxRevisions?: number;
  expectedDelivery?: string;
  stripePaymentIntentId?: string;
  paymentReleased?: boolean;
  cancelReason?: string;
  paidAt?: string;
  processingAt?: string;
  startedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface TimelineEvent {
  status: string;
  description?: string;
  date: string;
  icon?: string;
  by?: string;
}

type Tab = 'details' | 'timeline' | 'delivery';

// ─── Helpers ──────────────────────────────────────────────────

const STATUS_META: Record<string, { classes: string; label: string; dot: string }> = {
  pending:                   { classes: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20', label: 'Pending',           dot: 'bg-yellow-500' },
  pending_payment:           { classes: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20', label: 'Pending Payment',   dot: 'bg-yellow-500' },
  paid:                      { classes: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',             label: 'Paid',             dot: 'bg-blue-500' },
  processing:                { classes: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',             label: 'Processing',       dot: 'bg-blue-500' },
  in_progress:               { classes: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20', label: 'In Progress',      dot: 'bg-indigo-500' },
  delivered:                 { classes: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', label: 'Delivered',   dot: 'bg-emerald-500' },
  in_revision:               { classes: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', label: 'In Revision',      dot: 'bg-orange-500' },
  completed:                 { classes: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',       label: 'Completed',        dot: 'bg-green-600' },
  completed_payment_pending: { classes: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',       label: 'Completed',        dot: 'bg-green-600' },
  released:                  { classes: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',       label: 'Released',         dot: 'bg-green-600' },
  cancelled:                 { classes: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',                   label: 'Cancelled',        dot: 'bg-red-500' },
  refunded:                  { classes: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20',             label: 'Refunded',         dot: 'bg-gray-400' },
  disputed:                  { classes: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',                   label: 'Disputed',         dot: 'bg-red-500' },
};

const STATUS_ACCENT: Record<string, string> = {
  pending: 'from-yellow-500/15', pending_payment: 'from-yellow-500/15',
  paid: 'from-blue-500/15', processing: 'from-blue-500/15',
  in_progress: 'from-indigo-500/15', in_revision: 'from-orange-500/15',
  delivered: 'from-emerald-500/15',
  completed: 'from-green-500/15', completed_payment_pending: 'from-green-500/15', released: 'from-green-500/15',
  cancelled: 'from-red-500/15', disputed: 'from-red-500/15',
  refunded: 'from-gray-500/10',
};

function fmtDate(d?: string) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '-'; }
}

function fmtMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
}

function fmtStatus(s?: string) {
  if (!s) return 'N/A';
  if (STATUS_META[s]) return STATUS_META[s].label;
  return s.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Sub-components ───────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const meta = STATUS_META[status] ?? { classes: 'bg-gray-100 text-gray-600 border-gray-200', label: fmtStatus(status), dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${meta.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="mp-info-row">
    <span className="mp-info-row-label">{label}</span>
    <span className="mp-info-row-value">{value}</span>
  </div>
);

// ─── Main component ───────────────────────────────────────────

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authUser } = useAuth();

  const [order, setOrder]                     = useState<Order | null>(null);
  const [timeline, setTimeline]               = useState<TimelineEvent[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [activeTab, setActiveTab]             = useState<Tab>('details');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [actionLoading, setActionLoading]     = useState('');
  const [revisionNotes, setRevisionNotes]     = useState('');
  const [cancelReason, setCancelReason]       = useState('');
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [showCancelInput, setShowCancelInput]     = useState(false);

  const BASE = '/marketplace/orders';

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res: any = await api.get(`${BASE}/${id}`);
      const data = res?.order ?? res?.data?.order ?? res?.data ?? res;
      if (data?._id) setOrder(data);
      else toast.error('Order not found');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    if (!id) return;
    setTimelineLoading(true);
    try {
      const res: any = await api.get(`${BASE}/${id}/timeline`);
      const events = res?.timeline ?? res?.data?.timeline ?? res?.data ?? [];
      setTimeline(Array.isArray(events) ? events : []);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);
  useEffect(() => { if (activeTab === 'timeline') fetchTimeline(); }, [activeTab]);

  const uid      = authUser?._id ?? (authUser as any)?.id ?? (authUser as any)?.userId ?? '';
  const isBuyer  = !!order && (order.buyerId?._id === uid);
  const isSeller = !!order && (order.sellerId?._id === uid);

  const doAction = async (label: string, fn: () => Promise<void>) => {
    setActionLoading(label);
    try {
      await fn();
      await fetchOrder();
      toast.success(`${label} successful`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? `${label} failed`);
    } finally {
      setActionLoading('');
    }
  };

  const handleStartProcessing = () =>
    doAction('Start Processing', () => api.put(`${BASE}/${id}/start-processing`) as Promise<any>);
  const handleStartWork = () =>
    doAction('Start Work', () => api.put(`${BASE}/${id}/start-work`) as Promise<any>);
  const handleDeliver = () => {
    if (!deliveryMessage.trim()) { toast.error('Please add a delivery message'); return; }
    doAction('Deliver', async () => {
      const fd = new FormData();
      fd.append('message', deliveryMessage);
      await api.put(`${BASE}/${id}/deliver`, fd as unknown as Record<string, unknown>);
      setDeliveryMessage('');
    });
  };
  const handleAcceptDelivery = () =>
    doAction('Accept Delivery', () => api.put(`${BASE}/${id}/complete`) as Promise<any>);
  const handleRequestRevision = () => {
    if (!revisionNotes.trim()) { toast.error('Please enter revision notes'); return; }
    doAction('Request Revision', async () => {
      await api.put(`${BASE}/${id}/request-revision`, { revisionNotes });
      setRevisionNotes(''); setShowRevisionInput(false);
    });
  };
  const handleCancelByBuyer = () => {
    doAction('Cancel Order', async () => {
      await api.put(`${BASE}/${id}/cancel-by-buyer`, { cancelReason });
      setCancelReason(''); setShowCancelInput(false);
    });
  };
  const handleCancelBySeller = () =>
    doAction('Cancel Order', () => api.put(`${BASE}/${id}/cancel-by-seller`) as Promise<any>);

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <MarketplaceLayout>
      <div className="mp-page flex items-center justify-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <div className="mp-spinner mx-auto mb-4" />
          <p className="text-sm text-text-secondary font-medium">Loading order details…</p>
        </div>
      </div>
    </MarketplaceLayout>
  );

  if (!order) return (
    <MarketplaceLayout>
      <div className="mp-page">
        <div className="max-w-sm mx-auto mt-16 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <FiAlertTriangle className="text-red-500" size={28} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Order Not Found</h3>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            This order doesn't exist or you don't have access to view it.
          </p>
          <button
            onClick={() => router.push('/marketplace/dashboard/buyer')}
            className="mp-btn mp-btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </MarketplaceLayout>
  );

  const canCancel = ['pending', 'pending_payment', 'paid', 'processing'].includes(order.status);
  const accentFrom = STATUS_ACCENT[order.status] ?? 'from-yellow-500/10';

  return (
    <MarketplaceLayout>
      <div className="mp-page">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* ── Header ── */}
          <div className={`mp-card bg-gradient-to-r ${accentFrom} to-transparent p-5 sm:p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors self-start flex-shrink-0"
              >
                <FaArrowLeft size={12} /> Back
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-1">Order</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary truncate">
                      #{order.orderNumber ?? order._id.slice(-8).toUpperCase()}
                    </h1>
                    <p className="text-xs text-text-tertiary mt-0.5">{fmtDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                {/* listing title quick-preview */}
                {order.listingId && typeof order.listingId === 'object' && order.listingId.title && (
                  <p className="mt-3 text-sm text-text-secondary">
                    <span className="text-text-tertiary">Listing: </span>
                    <span className="font-medium text-text-primary">{order.listingId.title}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Main column ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Payment Summary */}
              <div className="mp-card overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-card-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-500/15 flex items-center justify-center">
                      <FiDollarSign className="text-yellow-600 dark:text-yellow-400" size={18} />
                    </div>
                    <h2 className="text-base font-bold text-text-primary">Payment Summary</h2>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Total Amount', value: fmtMoney(order.amount), sub: 'Buyer paid', color: 'text-text-primary' },
                      { label: 'Platform Fee', value: fmtMoney(order.platformFee ?? Math.round(order.amount * 0.1)), sub: '10% service fee', color: 'text-text-secondary' },
                      { label: 'Seller Payout', value: fmtMoney(order.sellerAmount ?? Math.round(order.amount * 0.9)), sub: 'After escrow release', color: 'text-green-600 dark:text-green-400' },
                    ].map(({ label, value, sub, color }) => (
                      <div key={label} className="rounded-xl p-4 bg-bg-secondary border border-card-border text-center sm:text-left">
                        <p className="text-xs text-text-tertiary mb-1 font-medium">{label}</p>
                        <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                        <p className="text-[11px] text-text-tertiary mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>

                  {order.paymentReleased && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                      <FiCheck size={13} />
                      Payment has been released to the seller.
                    </div>
                  )}
                </div>
              </div>

              {/* Tabbed detail panel */}
              <div className="mp-card overflow-hidden">
                {/* Tab bar */}
                <div className="mp-tabs-bar">
                  {([
                    { id: 'details',  label: 'Details',  icon: FiList },
                    { id: 'timeline', label: 'Timeline', icon: FiClock },
                    { id: 'delivery', label: 'Actions',  icon: FiPackage },
                  ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id: tabId, label, icon: Icon }) => (
                    <button
                      key={tabId}
                      onClick={() => setActiveTab(tabId)}
                      className={`mp-tab-item ${activeTab === tabId ? 'active' : ''}`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-5 sm:p-6">
                  {/* ── Details tab ── */}
                  {activeTab === 'details' && (
                    <div className="space-y-5">
                      {/* Parties */}
                      <div>
                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Parties</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { role: 'Buyer', party: order.buyerId, icon: FiUser, color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400' },
                            { role: 'Seller', party: order.sellerId, icon: FiUser, color: 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400' },
                          ].map(({ role, party, icon: Icon, color }) => (
                            <div key={role} className="flex items-start gap-3 p-4 bg-bg-secondary border border-card-border rounded-xl">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-0.5">{role}</p>
                                <p className="font-semibold text-text-primary truncate">{party?.username ?? 'Unknown'}</p>
                                {(party?.firstName || party?.lastName) && (
                                  <p className="text-xs text-text-secondary mt-0.5 truncate">
                                    {[party.firstName, party.lastName].filter(Boolean).join(' ')}
                                  </p>
                                )}
                                {role === 'Seller' && party?.sellerRating && (
                                  <p className="text-xs text-yellow-500 mt-1">⭐ {party.sellerRating}/5</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Listing */}
                      {order.listingId && typeof order.listingId === 'object' && (
                        <div>
                          <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Listing</p>
                          <div className="p-4 bg-bg-secondary border border-card-border rounded-xl">
                            <p className="font-semibold text-text-primary">{order.listingId.title ?? 'N/A'}</p>
                            {order.listingId.description && (
                              <p className="text-sm text-text-secondary mt-1 leading-relaxed line-clamp-2">
                                {order.listingId.description}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2.5 flex-wrap">
                              {order.listingId.category && (
                                <span className="mp-badge mp-badge-info text-[11px]">{order.listingId.category}</span>
                              )}
                              {order.listingId.type && (
                                <span className="mp-badge mp-badge-accent text-[11px]">{order.listingId.type}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes / Requirements */}
                      {[
                        { label: 'Requirements', value: order.requirements },
                        { label: 'Buyer Notes',  value: order.buyerNotes },
                        { label: 'Seller Notes', value: order.sellerNotes },
                      ].filter(n => n.value).map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">{label}</p>
                          <div className="bg-bg-secondary rounded-xl p-4 border border-card-border text-sm leading-relaxed text-text-primary">
                            {value}
                          </div>
                        </div>
                      ))}

                      {/* Order meta */}
                      <div>
                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Order Details</p>
                        <div className="bg-bg-secondary rounded-xl border border-card-border px-4 divide-y divide-divider">
                          <InfoRow label="Type"           value={fmtStatus(order.orderType)} />
                          <InfoRow label="Created"        value={fmtDate(order.createdAt)} />
                          {order.paidAt       && <InfoRow label="Paid On"         value={fmtDate(order.paidAt)} />}
                          {order.deliveredAt  && <InfoRow label="Delivered On"    value={fmtDate(order.deliveredAt)} />}
                          {order.completedAt  && <InfoRow label="Completed On"    value={fmtDate(order.completedAt)} />}
                          {order.expectedDelivery && <InfoRow label="Expected By" value={fmtDate(order.expectedDelivery)} />}
                          {order.revisions !== undefined && (
                            <InfoRow label="Revisions" value={
                              <span>
                                <span className="font-bold text-text-primary">{order.revisions}</span>
                                <span className="text-text-tertiary"> / {order.maxRevisions ?? '∞'}</span>
                              </span>
                            } />
                          )}
                          {order.stripePaymentIntentId && (
                            <InfoRow label="Payment ID" value={
                              <span className="font-mono text-xs text-text-tertiary">
                                …{order.stripePaymentIntentId.slice(-12)}
                              </span>
                            } />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Timeline tab ── */}
                  {activeTab === 'timeline' && (
                    <div>
                      {timelineLoading ? (
                        <div className="flex items-center justify-center gap-2.5 text-text-secondary py-12">
                          <div className="mp-spinner mp-spinner-sm" />
                          <span className="text-sm">Loading timeline…</span>
                        </div>
                      ) : timeline.length === 0 ? (
                        <div className="mp-empty-state py-12">
                          <div className="mp-empty-state-icon"><FiClock size={24} /></div>
                          <p className="mp-empty-state-title text-base">No Timeline Events</p>
                          <p className="mp-empty-state-text text-sm">Activity will appear here as the order progresses.</p>
                        </div>
                      ) : (
                        <div className="space-y-0">
                          {timeline.map((ev, i) => {
                            const meta = STATUS_META[ev.status];
                            return (
                              <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${meta?.dot ?? 'bg-yellow-500'}`} />
                                  {i < timeline.length - 1 && <div className="w-px bg-divider flex-1 my-1.5" />}
                                </div>
                                <div className="pb-5 min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-text-primary capitalize">
                                    {ev.icon && <span className="mr-1">{ev.icon}</span>}
                                    {meta?.label ?? ev.status.replace(/_/g, ' ')}
                                  </p>
                                  {ev.description && (
                                    <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{ev.description}</p>
                                  )}
                                  <p className="text-xs text-text-tertiary mt-1">{fmtDate(ev.date)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Actions/Delivery tab ── */}
                  {activeTab === 'delivery' && (
                    <div className="space-y-4">
                      {/* ─ Seller actions ─ */}
                      {isSeller && (
                        <>
                          {order.status === 'paid' && (
                            <div className="mp-action-panel mp-action-panel-info">
                              <div className="flex items-center gap-2.5 mb-3">
                                <FaCog className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={15} />
                                <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Ready to Start?</h3>
                              </div>
                              <p className="text-sm text-blue-700 dark:text-blue-400 mb-4 leading-relaxed">
                                The buyer has paid. Click below to begin processing this order.
                              </p>
                              <button
                                onClick={handleStartProcessing}
                                disabled={!!actionLoading}
                                className="mp-btn mp-btn-primary"
                              >
                                {actionLoading === 'Start Processing'
                                  ? <><FaSpinner className="animate-spin" /> Processing…</>
                                  : <><FaCog /> Start Processing</>
                                }
                              </button>
                            </div>
                          )}

                          {order.status === 'processing' && (
                            <div className="mp-action-panel" style={{ background: 'var(--color-info-bg)', borderColor: 'color-mix(in srgb, var(--color-info) 25%, transparent)' }}>
                              <div className="flex items-center gap-2.5 mb-3">
                                <FaPlay className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" size={13} />
                                <h3 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Start Work</h3>
                              </div>
                              <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-4 leading-relaxed">
                                Mark this order as in-progress to begin working on the delivery.
                              </p>
                              <button
                                onClick={handleStartWork}
                                disabled={!!actionLoading}
                                className="mp-btn mp-btn-primary"
                              >
                                {actionLoading === 'Start Work'
                                  ? <><FaSpinner className="animate-spin" /> Starting…</>
                                  : <><FaPlay /> Start Work</>
                                }
                              </button>
                            </div>
                          )}

                          {(order.status === 'in_progress' || order.status === 'in_revision') && (
                            <div className="mp-card p-5">
                              <h3 className="font-bold text-text-primary text-sm mb-1">
                                {order.status === 'in_revision' ? 'Submit Revision' : 'Deliver Your Work'}
                              </h3>
                              {order.status === 'in_revision' && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 mb-3 font-medium">
                                  The buyer has requested revisions.
                                </p>
                              )}
                              <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                                Write a clear delivery message describing what you've completed.
                              </p>
                              <textarea
                                value={deliveryMessage}
                                onChange={e => setDeliveryMessage(e.target.value)}
                                rows={4}
                                placeholder="Describe what you've delivered. Include any relevant links, notes, or access instructions…"
                                className="mp-textarea mb-3"
                              />
                              <button
                                onClick={handleDeliver}
                                disabled={!!actionLoading || !deliveryMessage.trim()}
                                className="mp-btn mp-btn-success"
                              >
                                {actionLoading === 'Deliver'
                                  ? <><FaSpinner className="animate-spin" /> Submitting…</>
                                  : <><FaPaperPlane /> {order.status === 'in_revision' ? 'Submit Revision' : 'Deliver Order'}</>
                                }
                              </button>
                            </div>
                          )}

                          {['paid', 'processing', 'in_progress'].includes(order.status) && (
                            <button
                              onClick={handleCancelBySeller}
                              disabled={!!actionLoading}
                              className="mp-btn mp-btn-danger"
                            >
                              {actionLoading === 'Cancel Order'
                                ? <><FaSpinner className="animate-spin" /> Cancelling…</>
                                : <><FaBan /> Cancel Order</>
                              }
                            </button>
                          )}
                        </>
                      )}

                      {/* ─ Buyer actions ─ */}
                      {isBuyer && (
                        <>
                          {order.status === 'pending_payment' && (
                            <div className="mp-action-panel mp-action-panel-warning">
                              <div className="flex items-center gap-2.5 mb-3">
                                <FiDollarSign className="text-yellow-700 dark:text-yellow-400 flex-shrink-0" size={16} />
                                <h3 className="font-bold text-yellow-800 dark:text-yellow-300 text-sm">Payment Required</h3>
                              </div>
                              <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4 leading-relaxed">
                                Complete your payment to activate this order and notify the seller.
                              </p>
                              <button
                                onClick={() => router.push(`/marketplace/payment/${id}`)}
                                className="mp-btn mp-btn-primary"
                              >
                                Complete Payment →
                              </button>
                            </div>
                          )}

                          {order.status === 'delivered' && (
                            <div className="mp-card p-5 space-y-4">
                              <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                                <FiPackage size={15} className="text-emerald-500" />
                                Review Delivery
                              </h3>

                              {order.deliveryMessage && (
                                <div className="bg-bg-secondary rounded-xl p-4 border border-card-border">
                                  <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">Seller's Message</p>
                                  <p className="text-sm text-text-primary leading-relaxed">{order.deliveryMessage}</p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-3">
                                <button
                                  onClick={handleAcceptDelivery}
                                  disabled={!!actionLoading}
                                  className="mp-btn mp-btn-success"
                                >
                                  {actionLoading === 'Accept Delivery'
                                    ? <><FaSpinner className="animate-spin" /> Accepting…</>
                                    : <><FaCheckCircle /> Accept Delivery</>
                                  }
                                </button>

                                {order.revisions !== undefined &&
                                 order.maxRevisions !== undefined &&
                                 order.revisions < order.maxRevisions && (
                                  <button
                                    onClick={() => setShowRevisionInput(v => !v)}
                                    className="mp-btn mp-btn-secondary"
                                  >
                                    <FaRedo size={12} />
                                    Request Revision ({order.maxRevisions - order.revisions} left)
                                  </button>
                                )}
                              </div>

                              {showRevisionInput && (
                                <div className="space-y-3 pt-2 border-t border-divider">
                                  <p className="text-xs text-text-secondary font-medium">Describe what needs to be revised:</p>
                                  <textarea
                                    value={revisionNotes}
                                    onChange={e => setRevisionNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Be specific about what changes you need…"
                                    className="mp-textarea"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleRequestRevision}
                                      disabled={!!actionLoading || !revisionNotes.trim()}
                                      className="mp-btn mp-btn-primary"
                                    >
                                      {actionLoading === 'Request Revision' ? 'Submitting…' : 'Submit Revision Request'}
                                    </button>
                                    <button
                                      onClick={() => setShowRevisionInput(false)}
                                      className="mp-btn mp-btn-ghost"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {canCancel && (
                            <div className="mp-action-panel mp-action-panel-danger">
                              <div className="flex items-center gap-2.5 mb-3">
                                <FiBan className="text-red-600 dark:text-red-400 flex-shrink-0" size={15} />
                                <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">Cancel Order</h3>
                              </div>
                              <p className="text-sm text-red-600 dark:text-red-400 mb-4 leading-relaxed">
                                You can cancel this order while it hasn't been worked on yet.
                              </p>
                              {!showCancelInput ? (
                                <button
                                  onClick={() => setShowCancelInput(true)}
                                  className="mp-btn mp-btn-danger"
                                >
                                  <FaBan size={12} /> Cancel Order
                                </button>
                              ) : (
                                <div className="space-y-3">
                                  <textarea
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                    rows={2}
                                    placeholder="Reason for cancellation (optional)…"
                                    className="mp-textarea"
                                    style={{ borderColor: 'var(--color-danger)', borderOpacity: 0.4 } as React.CSSProperties}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleCancelByBuyer}
                                      disabled={!!actionLoading}
                                      className="mp-btn mp-btn-danger"
                                    >
                                      {actionLoading === 'Cancel Order' ? 'Cancelling…' : 'Confirm Cancel'}
                                    </button>
                                    <button
                                      onClick={() => setShowCancelInput(false)}
                                      className="mp-btn mp-btn-ghost"
                                    >
                                      Keep Order
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* Completed state */}
                      {['completed', 'completed_payment_pending', 'released'].includes(order.status) && (
                        <div className="rounded-2xl border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 p-6 text-center">
                          <div className="w-14 h-14 bg-white dark:bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <FaCheckCircle className="text-green-500" size={28} />
                          </div>
                          <h3 className="font-bold text-green-800 dark:text-green-300 text-base mb-1">Order Completed</h3>
                          {order.completedAt && (
                            <p className="text-sm text-green-700 dark:text-green-400">{fmtDate(order.completedAt)}</p>
                          )}
                          <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                            {order.paymentReleased
                              ? 'Payment has been released to the seller.'
                              : 'Payment will be released to the seller shortly.'}
                          </p>
                        </div>
                      )}

                      {/* Cancelled state */}
                      {order.status === 'cancelled' && (
                        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-6 text-center">
                          <div className="w-14 h-14 bg-white dark:bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <FaTimesCircle className="text-red-500" size={28} />
                          </div>
                          <h3 className="font-bold text-red-800 dark:text-red-300 text-base mb-1">Order Cancelled</h3>
                          {order.cancelReason && (
                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{order.cancelReason}</p>
                          )}
                          {order.cancelledAt && (
                            <p className="text-xs text-red-600 dark:text-red-500 mt-2">{fmtDate(order.cancelledAt)}</p>
                          )}
                        </div>
                      )}

                      {/* No actions available */}
                      {!isBuyer && !isSeller && (
                        <div className="mp-empty-state py-10">
                          <div className="mp-empty-state-icon"><FiPackage size={22} /></div>
                          <p className="mp-empty-state-title text-base">No Actions Available</p>
                          <p className="mp-empty-state-text text-sm">Actions appear here based on your role and the current order status.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">
              {/* Quick actions */}
              <div className="mp-card p-5">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push(`/marketplace/messages?order=${id}`)}
                    className="mp-btn mp-btn-secondary w-full justify-start"
                  >
                    <FaComment size={13} />
                    Contact {isSeller ? 'Buyer' : 'Seller'}
                  </button>
                  <button
                    onClick={fetchOrder}
                    className="mp-btn mp-btn-secondary w-full justify-start"
                  >
                    <FaSync size={12} />
                    Refresh Order
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="mp-btn mp-btn-ghost w-full justify-start"
                  >
                    <FaPrint size={12} />
                    Print Details
                  </button>
                </div>
              </div>

              {/* Order info */}
              <div className="mp-card p-5">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Order Info</h3>
                <div className="divide-y divide-divider">
                  {order.orderNumber && <InfoRow label="Order #" value={<span className="font-mono text-xs">{order.orderNumber}</span>} />}
                  <InfoRow label="Status"  value={<StatusBadge status={order.status} />} />
                  <InfoRow label="Payment" value={<StatusBadge status={order.paymentStatus} />} />
                  {order.orderType && <InfoRow label="Type" value={fmtStatus(order.orderType)} />}
                  {order.revisions !== undefined && (
                    <InfoRow label="Revisions" value={`${order.revisions} / ${order.maxRevisions ?? '∞'}`} />
                  )}
                  {order.expectedDelivery && (
                    <InfoRow label="Due" value={fmtDate(order.expectedDelivery)} />
                  )}
                </div>
              </div>

              {/* Mini timeline */}
              <div className="mp-card p-5">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Progress</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Created',    date: order.createdAt,   dot: 'bg-green-500' },
                    { label: 'Paid',       date: order.paidAt,      dot: 'bg-blue-500' },
                    { label: 'Processing', date: order.processingAt, dot: 'bg-indigo-500' },
                    { label: 'Work Started', date: order.startedAt, dot: 'bg-purple-500' },
                    { label: 'Delivered',  date: order.deliveredAt, dot: 'bg-emerald-500' },
                    { label: 'Completed',  date: order.completedAt, dot: 'bg-green-600' },
                    { label: 'Cancelled',  date: order.cancelledAt, dot: 'bg-red-500' },
                  ].filter(e => e.date).map(({ label, date, dot }, i, arr) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${dot}`} />
                        {i < arr.length - 1 && <div className="w-px h-3 bg-divider mt-1" />}
                      </div>
                      <div className="-mt-0.5">
                        <p className="text-xs font-semibold text-text-primary">{label}</p>
                        <p className="text-[11px] text-text-tertiary mt-0.5">{fmtDate(date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
};

// Need to import FiBan
const FiBan = FaBan as any;

export default OrderDetails;
