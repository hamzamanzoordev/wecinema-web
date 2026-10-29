"use client";
// src/pages/marketplace/MyOrders.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiPackage, FiShoppingBag, FiCheckCircle, FiClock,
  FiTruck, FiDollarSign, FiUser, FiCalendar,
  FiSearch, FiAlertCircle, FiRefreshCw, FiX,
  FiFilter, FiExternalLink,
} from 'react-icons/fi';

import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getMyOrders } from '@/features/marketplace/api/order.service';
import type {
  Order,
  OrderStatus,
  BuyerOrderStats,
  OrderUser,
  OrderListing,
} from '@/types/order.types';

// ─── Helpers ─────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getSellerUsername(order: Order): string {
  if (typeof order.sellerId === 'object' && order.sellerId !== null) {
    const s = order.sellerId as OrderUser;
    return s.firstName ? `${s.firstName} ${s.lastName ?? ''}`.trim() : s.username;
  }
  return 'Unknown Seller';
}

function getListingTitle(order: Order): string {
  if (typeof order.listingId === 'object' && order.listingId !== null) {
    return (order.listingId as OrderListing).title || 'Unnamed Listing';
  }
  return 'Unnamed Listing';
}

function getListingMedia(order: Order): string | undefined {
  if (typeof order.listingId === 'object' && order.listingId !== null) {
    return (order.listingId as OrderListing).mediaUrls?.[0];
  }
  return undefined;
}

// ─── Status config ────────────────────────────────────────────

const STATUS_CFG: Record<OrderStatus, { label: string; twColor: string; twBg: string; icon: React.ReactElement }> = {
  pending_payment:           { label: 'Payment Pending',   twColor: 'text-yellow-400',  twBg: 'bg-yellow-400/10',  icon: <FiClock /> },
  paid:                      { label: 'Paid',              twColor: 'text-sky-400',     twBg: 'bg-sky-400/10',     icon: <FiDollarSign /> },
  processing:                { label: 'Processing',        twColor: 'text-violet-400',  twBg: 'bg-violet-400/10', icon: <FiRefreshCw /> },
  in_progress:               { label: 'In Progress',       twColor: 'text-blue-400',    twBg: 'bg-blue-400/10',    icon: <FiUser /> },
  delivered:                 { label: 'Delivered',         twColor: 'text-teal-400',    twBg: 'bg-teal-400/10',    icon: <FiTruck /> },
  in_revision:               { label: 'In Revision',       twColor: 'text-orange-400',  twBg: 'bg-orange-400/10',  icon: <FiClock /> },
  completed:                 { label: 'Completed',         twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10', icon: <FiCheckCircle /> },
  completed_payment_pending: { label: 'Payout Pending',    twColor: 'text-amber-400',   twBg: 'bg-amber-400/10',   icon: <FiClock /> },
  completing:                { label: 'Completing…',       twColor: 'text-violet-400',  twBg: 'bg-violet-400/10', icon: <FiRefreshCw /> },
  cancelled:                 { label: 'Cancelled',         twColor: 'text-red-400',     twBg: 'bg-red-400/10',     icon: <FiX /> },
  disputed:                  { label: 'Disputed',          twColor: 'text-red-400',     twBg: 'bg-red-400/10',     icon: <FiAlertCircle /> },
};

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending',   label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

type TabKey = typeof TABS[number]['key'];

const ACTIVE_STATUSES: OrderStatus[] = ['paid', 'processing', 'in_progress', 'delivered', 'in_revision'];

// ─── Component ───────────────────────────────────────────────

const MyOrders: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [orders,      setOrders]      = useState<Order[]>([]);
  const [stats,       setStats]       = useState<BuyerOrderStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [activeTab,   setActiveTab]   = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyOrders();
      setOrders(res.orders ?? []);
      setStats(res.stats ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Filter ────────────────────────────────────────────────
  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      getListingTitle(order).toLowerCase().includes(q) ||
      getSellerUsername(order).toLowerCase().includes(q) ||
      (order.orderNumber ?? '').toLowerCase().includes(q);

    const matchesTab =
      activeTab === 'all'       ? true :
      activeTab === 'active'    ? ACTIVE_STATUSES.includes(order.status) :
      activeTab === 'completed' ? order.status === 'completed' :
      activeTab === 'pending'   ? order.status === 'pending_payment' :
      activeTab === 'cancelled' ? order.status === 'cancelled' :
      true;

    return matchesSearch && matchesTab;
  });

  const tabCount = (key: TabKey) => {
    if (key === 'all')       return orders.length;
    if (key === 'active')    return orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
    if (key === 'completed') return orders.filter(o => o.status === 'completed').length;
    if (key === 'pending')   return orders.filter(o => o.status === 'pending_payment').length;
    if (key === 'cancelled') return orders.filter(o => o.status === 'cancelled').length;
    return 0;
  };

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <MarketplaceLayout>
        <div className="bg-bg-secondary theme-transition flex items-center justify-center p-4">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 animate-pulse bg-accent opacity-20 rounded-full blur-xl" />
              <div className="relative animate-spin rounded-full h-24 w-24 border-4 border-transparent border-t-accent border-r-accent mx-auto" />
            </div>
            <p className="mt-8 text-text-primary text-xl font-bold tracking-wider">LOADING ORDERS</p>
            <p className="mt-2 text-text-secondary text-sm">Fetching your purchase history…</p>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <MarketplaceLayout>
      <div className="bg-bg-secondary theme-transition py-8">

        {/* Ambient bg */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* ── Header ── */}
          <div className="mb-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary theme-transition">My Orders</h1>
                <p className="text-text-secondary text-lg theme-transition">Track and manage all your purchases</p>
              </div>

              <button
                onClick={fetchOrders}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-sm font-medium transition-all theme-transition disabled:opacity-60 self-start"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
                Refresh
              </button>
            </div>

            {/* Stat cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                {[
                  { label: 'Total Orders',  value: stats.total,     twColor: 'text-indigo-400', twBg: 'bg-indigo-400/10', icon: <FiPackage /> },
                  { label: 'Active',        value: stats.active,    twColor: 'text-sky-400',    twBg: 'bg-sky-400/10',    icon: <FiRefreshCw /> },
                  { label: 'Completed',     value: stats.completed, twColor: 'text-emerald-400',twBg: 'bg-emerald-400/10',icon: <FiCheckCircle /> },
                  { label: 'Total Spent',   value: formatCurrency(stats.totalSpent), twColor: 'text-amber-400', twBg: 'bg-amber-400/10', icon: <FiDollarSign /> },
                ].map(s => (
                  <div
                    key={s.label}
                    className="bg-card-bg border border-border rounded-2xl p-5 flex gap-4 items-start hover:border-accent/40 transition-all theme-transition"
                  >
                    <div className={`w-10 h-10 flex-shrink-0 rounded-xl ${s.twBg} flex items-center justify-center ${s.twColor}`}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary leading-tight">{s.value}</p>
                      <p className="text-sm text-text-secondary mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-danger/10 border border-danger/30 rounded-2xl theme-transition">
              <FiAlertCircle className="text-danger flex-shrink-0" size={20} />
              <p className="flex-1 text-danger text-sm font-medium">{error}</p>
              <button
                onClick={fetchOrders}
                className="text-danger underline hover:no-underline text-sm flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Filters bar ── */}
          <div className="bg-card-bg border border-border rounded-2xl p-4 mb-6 theme-transition">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by title, seller, or order number…"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input-border bg-input-bg text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-input-focus transition-all theme-transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-bg-secondary rounded-xl p-1 border border-border">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all theme-transition ${
                      activeTab === tab.key
                        ? 'bg-accent text-btn-primary-text shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === tab.key ? 'bg-white/20' : 'bg-border'
                    }`}>
                      {tabCount(tab.key)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Orders list ── */}
          {filteredOrders.length > 0 ? (
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const cfg    = STATUS_CFG[order.status] ?? { label: order.status, twColor: 'text-gray-400', twBg: 'bg-gray-400/10', icon: <FiPackage /> };
                const media  = getListingMedia(order);
                const title  = getListingTitle(order);
                const seller = getSellerUsername(order);

                return (
                  <div
                    key={order._id}
                    onClick={() => router.push(`/marketplace/orders/${order._id}`)}
                    className="bg-card-bg border border-border rounded-2xl p-5 flex flex-col lg:flex-row gap-5 cursor-pointer hover:border-accent/40 hover:shadow-lg transition-all duration-200 group theme-transition"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-btn-secondary-bg border border-border flex items-center justify-center theme-transition">
                        {media ? (
                          <img
                            src={media}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <FiPackage className="text-text-tertiary" size={22} />
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Title row */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                            {title}
                          </h3>
                          <div className="flex items-center flex-wrap gap-3 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                              <FiUser size={11} /> {seller}
                            </span>
                            {order.orderNumber && (
                              <span className="text-xs text-text-tertiary font-mono">#{order.orderNumber}</span>
                            )}
                            {order.orderType === 'accepted_offer' && (
                              <span className="text-xs text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded">Custom Offer</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-bold text-text-primary">{formatCurrency(order.amount)}</p>
                          <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.twBg} ${cfg.twColor}`}>
                            <span className="text-[11px]">{cfg.icon}</span>
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                        <span className="inline-flex items-center gap-1">
                          <FiCalendar size={11} /> Ordered {formatDate(order.createdAt)}
                        </span>
                        {order.expectedDelivery && (
                          <span className="inline-flex items-center gap-1">
                            <FiClock size={11} /> Due {formatDate(order.expectedDelivery)}
                          </span>
                        )}
                        {order.deliveredAt && (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <FiTruck size={11} /> Delivered {formatDate(order.deliveredAt)}
                          </span>
                        )}
                        {order.revisions > 0 && (
                          <span className="inline-flex items-center gap-1 text-text-tertiary">
                            Revisions {order.revisions}/{order.maxRevisions}
                          </span>
                        )}
                      </div>

                      {/* Action row */}
                      <div className="flex flex-wrap gap-2 pt-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/marketplace/orders/${order._id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-btn-primary-text text-xs font-semibold transition-all theme-transition"
                        >
                          <FiExternalLink size={12} /> View Details
                        </button>

                        {order.status === 'delivered' && (
                          <button
                            onClick={() => router.push(`/marketplace/orders/${order._id}?tab=files`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-semibold transition-all"
                          >
                            <FiCheckCircle size={12} /> Review Delivery
                          </button>
                        )}

                        {order.status === 'pending_payment' && (
                          <button
                            onClick={() => router.push(`/marketplace/payment/${order._id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-400/40 bg-sky-400/10 text-sky-400 hover:bg-sky-400/20 text-xs font-semibold transition-all"
                          >
                            <FiDollarSign size={12} /> Complete Payment
                          </button>
                        )}

                        {ACTIVE_STATUSES.includes(order.status) && (
                          <button
                            onClick={() => router.push(`/marketplace/messages?order=${order._id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-xs font-medium transition-all theme-transition"
                          >
                            Message Seller
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : orders.length > 0 ? (
            /* No results after filter */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-5">
                <FiFilter size={28} />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2 theme-transition">No matching orders</h3>
              <p className="text-text-secondary text-sm mb-6 theme-transition">Try adjusting your search or filter</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-sm font-medium transition-all theme-transition"
              >
                <FiX size={14} /> Clear Filters
              </button>
            </div>
          ) : (
            /* Empty — no orders at all */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
                <FiShoppingBag size={36} />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2 theme-transition">No orders yet</h3>
              <p className="text-text-secondary text-sm mb-6 max-w-sm theme-transition">
                Start shopping to see your orders here!
              </p>
              <button
                onClick={() => router.push('/marketplace')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-btn-primary-text font-semibold text-sm transition-all theme-transition"
              >
                <FiShoppingBag size={15} /> Browse Marketplace
              </button>
            </div>
          )}

        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default MyOrders;
