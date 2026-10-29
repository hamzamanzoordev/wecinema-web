"use client";
/**
 * EarningsTab — seller earnings dashboard
 * Data fetched internally via useSellerStats() and useStripeStatus().
 */

import React, { useState } from 'react';
import { useSellerStats, useStripeStatus } from '@/hooks/useOrder';

interface EarningsTabProps {
  onCreateListing?: () => void;
  onSetupPayments?: () => void;
}

function formatCurrency(dollars: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(dollars);
}

function prettyStatus(id: string): string {
  return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const STATUS_COLOR_HEX: Record<string, string> = {
  completed:       '#22c55e',
  in_progress:     '#3b82f6',
  pending_payment: '#eab308',
  paid:            '#6366f1',
};
const statusColorHex = (id: string): string => STATUS_COLOR_HEX[id] ?? '#9ca3af';

const ACTIVE_STATUSES = new Set(['paid', 'processing', 'in_progress', 'delivered', 'in_revision']);

const EarningsTab: React.FC<EarningsTabProps> = ({ onCreateListing, onSetupPayments }) => {
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');

  const { stats: rawStats, loading: statsLoading, error: statsError } = useSellerStats();
  const { accountStatus, isReady: stripeReady, loading: stripeLoading, recheck } = useStripeStatus();

  const loading = statsLoading || stripeLoading;

  const statsByStatus = (rawStats as any)?.statsByStatus ?? [];
  const totals        = (rawStats as any)?.totals ?? {};

  // totals from backend: { totalOrders, totalRevenue, averageOrderValue }
  const totalOrders   : number = totals.totalOrders     ?? 0;
  const avgOrderCents : number = totals.averageOrderValue ?? 0;
  const averageOrderValue = avgOrderCents / 100;

  // Derive completed / pending counts and amounts directly from statsByStatus
  // (the backend groups by order status, so each entry has _id, count, totalAmount)
  const completedStat  = statsByStatus.find((s: any) => s._id === 'completed');
  const completedOrders: number = completedStat?.count       ?? 0;
  const completedCents : number = completedStat?.totalAmount ?? 0;
  const completedEarnings = completedCents / 100;

  const pendingOrders: number = statsByStatus
    .filter((s: any) => ACTIVE_STATUSES.has(s._id))
    .reduce((sum: number, s: any) => sum + (s.count ?? 0), 0);

  const totalEarnings: number = statsByStatus
    .filter((s: any) => s._id === 'completed')
    .reduce((sum: number, s: any) => sum + (s.totalAmount ?? 0), 0) / 100;

  const pendingEarnings: number = statsByStatus
    .filter((s: any) => ACTIVE_STATUSES.has(s._id))
    .reduce((sum: number, s: any) => sum + (s.totalAmount ?? 0), 0) / 100;

  const availableBalance: number = ((accountStatus as any)?.balance?.available ?? 0) / 100;

  const findStat = (id: string) => statsByStatus.find((s: any) => s._id === id);
  const refunded   = findStat('refunded');
  const inRevision = findStat('in_revision');
  const disputed   = findStat('disputed');

  const hasData = rawStats !== null;

  return (
    <div className="space-y-8 animate-fade-in theme-transition">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Earnings Dashboard</h1>
          <p className="text-text-secondary mt-1">Track your revenue and financial performance</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="inline-flex rounded-lg border border-border bg-card-bg p-1">
            {(['all', 'month', 'week'] as const).map(range => (
              <button key={range} onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}>
                {range === 'all' ? 'All Time' : range === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>

          <button onClick={recheck} disabled={loading}
            className="px-4 py-2 bg-card-bg border border-border text-text-secondary hover:bg-bg-secondary text-sm font-medium rounded-lg transition duration-200 flex items-center shadow-sm disabled:opacity-50">
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Refreshing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {statsError && (
        <div className="bg-danger-bg border border-border rounded-xl p-4 text-sm text-danger">
          ⚠️ {statsError}. <button onClick={recheck} className="underline font-medium">Try again</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !hasData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-tertiary rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Key metrics */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:-translate-y-1 transition-transform duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium opacity-90">Total Earnings</h3>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><span className="text-xl">💰</span></div>
            </div>
            <p className="text-3xl font-bold mb-2">{formatCurrency(totalEarnings)}</p>
            <p className="text-sm opacity-80">All-time revenue from {totalOrders} orders</p>
            <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
              <span className="opacity-80">Completed: {completedOrders}</span>
              <span className="opacity-80">Pending: {pendingOrders}</span>
            </div>
          </div>

          <div className="bg-card-bg rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-text-secondary">Pending Earnings</h3>
              <div className="w-10 h-10 bg-warning-bg rounded-full flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-2">{formatCurrency(pendingEarnings)}</p>
            <p className="text-sm text-text-tertiary mt-3">{pendingOrders} active orders in progress</p>
          </div>

          <div className="bg-card-bg rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-text-secondary">Avg Order Value</h3>
              <div className="w-10 h-10 bg-bg-secondary rounded-full flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-2">{formatCurrency(averageOrderValue)}</p>
            <div className="flex items-center mt-3">
              <span className="font-medium text-text-primary">{completedOrders} orders</span>
              <span className="text-text-tertiary ml-2">completed</span>
            </div>
            <p className="text-sm text-text-tertiary mt-2">Per completed order</p>
          </div>
        </div>
      )}

      {/* Earnings breakdown */}
      {hasData && (
        <div className="bg-card-bg rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-bg-secondary to-card-bg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Earnings Breakdown</h3>
                <p className="text-sm text-text-secondary mt-1">Revenue by order status</p>
              </div>
              <span className="text-sm text-text-tertiary">
                {timeRange === 'all' ? 'All Time' : timeRange === 'month' ? 'This Month' : 'This Week'}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-success-bg border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-success font-medium">Completed Earnings</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(completedEarnings)}</p>
                    <p className="text-xs text-text-tertiary mt-2">{completedOrders} orders delivered</p>
                  </div>
                  <div className="w-14 h-14 bg-bg-secondary rounded-full flex items-center justify-center"><span className="text-2xl">✅</span></div>
                </div>
              </div>

              <div className="bg-warning-bg border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-warning font-medium">Pending Earnings</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(pendingEarnings)}</p>
                    <p className="text-xs text-text-tertiary mt-2">{pendingOrders} orders in progress</p>
                  </div>
                  <div className="w-14 h-14 bg-bg-secondary rounded-full flex items-center justify-center"><span className="text-2xl">⏳</span></div>
                </div>
              </div>

              <div className="bg-info-bg border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-info font-medium">Available Balance</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(availableBalance)}</p>
                    <p className="text-xs text-text-tertiary mt-2">
                      {stripeReady ? 'Ready to withdraw' : 'Connect Stripe to withdraw'}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-bg-secondary rounded-full flex items-center justify-center"><span className="text-2xl">💳</span></div>
                </div>
              </div>
            </div>

            {/* Per-status breakdown */}
            <div className="space-y-6">
              <h4 className="font-semibold text-text-primary text-lg">Revenue by Order Status</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsByStatus
                  .filter((s: any) => ['completed', 'in_progress', 'pending_payment', 'paid'].includes(s._id))
                  .map((stat: any) => (
                    <div key={stat._id} className="bg-bg-secondary hover:bg-bg-tertiary rounded-xl p-4 transition-colors duration-150">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: statusColorHex(stat._id) }}
                          />
                          <span className="font-medium text-sm text-text-primary">{prettyStatus(stat._id)}</span>
                        </div>
                        <span className="text-sm text-text-tertiary">{stat.count} orders</span>
                      </div>
                      <p className="text-2xl font-bold text-text-primary mb-1">
                        {formatCurrency(stat.totalAmount / 100)}
                      </p>
                      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${totalOrders > 0 ? (stat.count / totalOrders) * 100 : 0}%`,
                            backgroundColor: statusColorHex(stat._id),
                          }}
                        />
                      </div>
                      <p className="text-xs text-text-tertiary mt-2">
                        {totalOrders > 0 ? ((stat.count / totalOrders) * 100).toFixed(1) : 0}% of total
                      </p>
                    </div>
                  ))}
              </div>

              {/* Other statuses */}
              {((refunded?.count ?? 0) > 0 || (inRevision?.count ?? 0) > 0 || (disputed?.count ?? 0) > 0) && (
                <div className="mt-8">
                  <h5 className="font-medium text-text-secondary mb-4">Other Statuses</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {refunded?.count > 0 && (
                      <div className="bg-danger-bg border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-danger">Refunded</p>
                            <p className="text-xl font-bold text-text-primary">{formatCurrency(refunded.totalAmount / 100)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">{refunded.count} orders</p>
                            <p className="text-xs text-text-tertiary">{totalOrders > 0 ? ((refunded.count / totalOrders) * 100).toFixed(1) : 0}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {inRevision?.count > 0 && (
                      <div className="bg-warning-bg border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-warning">In Revision</p>
                            <p className="text-xl font-bold text-text-primary">{formatCurrency(inRevision.totalAmount / 100)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">{inRevision.count} orders</p>
                            <p className="text-xs text-text-tertiary">{totalOrders > 0 ? ((inRevision.count / totalOrders) * 100).toFixed(1) : 0}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {disputed?.count > 0 && (
                      <div className="bg-bg-secondary border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-text-secondary">Disputed</p>
                            <p className="text-xl font-bold text-text-primary">{formatCurrency(disputed.totalAmount / 100)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">{disputed.count} orders</p>
                            <p className="text-xs text-text-tertiary">{totalOrders > 0 ? ((disputed.count / totalOrders) * 100).toFixed(1) : 0}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance summary */}
      {hasData && (
        <div className="bg-bg-secondary border border-border rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Performance Summary</h3>
              <p className="text-sm text-text-secondary mt-1">Key metrics for your business</p>
            </div>
            <div className="mt-3 md:mt-0 flex items-center text-sm text-text-tertiary">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#22c55e' }} />
              Data updates in real-time
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { emoji: '📦', value: totalOrders,                       label: 'Total Orders',    sub: null,                                                                                        color: 'text-text-primary',    bg: 'bg-info-bg'    },
              { emoji: '✅', value: completedOrders,                   label: 'Completed',       sub: `${totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}% success rate`, color: 'text-success',         bg: 'bg-success-bg' },
              { emoji: '⏳', value: pendingOrders,                     label: 'In Progress',     sub: `${totalOrders > 0 ? ((pendingOrders / totalOrders) * 100).toFixed(1) : 0}% of orders`,     color: 'text-warning',         bg: 'bg-warning-bg' },
              { emoji: '📊', value: formatCurrency(averageOrderValue), label: 'Avg Order Value',  sub: 'Per completed order',                                                                      color: 'text-text-secondary',  bg: 'bg-bg-tertiary' },
            ].map(({ emoji, value, label, sub, color, bg }) => (
              <div key={label} className="text-center">
                <div className={`w-16 h-16 mx-auto mb-3 ${bg} rounded-full flex items-center justify-center`}>
                  <span className="text-2xl">{emoji}</span>
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-text-secondary">{label}</p>
                {sub && <p className={`text-xs ${color} mt-1`}>{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-info-bg border border-border rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-bg-secondary rounded-full flex items-center justify-center mr-4">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary">Tips to Increase Earnings</h4>
            <p className="text-sm text-text-secondary">Best practices for growing your revenue</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { emoji: '⭐', bg: 'bg-success-bg', color: 'text-success',        title: 'Optimize Listings',   body: 'Use high-quality images and detailed descriptions to attract more buyers.' },
            { emoji: '⚡', bg: 'bg-bg-tertiary', color: 'text-text-secondary', title: 'Fast Delivery',        body: 'Quick turnaround times lead to better reviews and more repeat customers.' },
            { emoji: '💬', bg: 'bg-warning-bg', color: 'text-warning',         title: 'Great Communication', body: 'Clear communication reduces revisions and increases customer satisfaction.' },
          ].map(({ emoji, bg, color, title, body }) => (
            <div key={title} className="bg-card-bg rounded-xl p-4 border border-border">
              <div className="flex items-center mb-2">
                <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center mr-3`}>
                  <span className={color}>{emoji}</span>
                </div>
                <h5 className="font-medium text-text-primary">{title}</h5>
              </div>
              <p className="text-sm text-text-secondary">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!hasData && !loading && (
        <div className="bg-bg-secondary border border-border rounded-2xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-info-bg rounded-full flex items-center justify-center">
            <span className="text-3xl">💰</span>
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">No Earnings Data Yet</h3>
          <p className="text-text-secondary max-w-md mx-auto mb-6">
            Start selling to see your earnings dashboard fill up with revenue data.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button onClick={onCreateListing}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md">
              Create Your First Listing
            </button>
            {!stripeReady && (
              <button onClick={onSetupPayments}
                className="px-6 py-3 bg-btn-secondary-bg border border-border text-btn-secondary-text font-medium rounded-lg hover:bg-btn-secondary-hover transition-all">
                Setup Payments
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsTab;
