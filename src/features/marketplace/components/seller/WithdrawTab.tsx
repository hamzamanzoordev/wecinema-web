"use client";
// src/components/marketplace/seller/WithdrawTab.tsx
import React, { useState, useEffect } from "react";
import { toast } from '@/lib/toast';
import { useStripeBalance, useWithdraw } from '@/features/marketplace/api/stripe.service';
import { formatCurrency } from '@/utils/helpers';
import type { Payout } from '@/types/stripe.types';

interface WithdrawTabProps {
  totalRevenue?:     number;
  thisMonthRevenue?: number;
  pendingRevenue?:   number;
  completedRevenue?: number;
  currentPage:       number;
  onPageChange:      (page: number) => void;
  onRefresh?:        () => Promise<void>;
  loading:           boolean;
}

const MIN_WITHDRAWAL_DOLLARS = 5;

const getStatusStyle = (status: string) => {
  const s = status?.toLowerCase() ?? "";
  if (s === "paid" || s === "completed" || s === "success")
    return "bg-success-bg text-success border-success/30";
  if (s === "pending" || s === "processing" || s === "in_progress")
    return "bg-warning-bg text-warning border-warning/30";
  if (s === "failed" || s === "rejected" || s === "canceled" || s === "cancelled")
    return "bg-danger-bg text-danger border-danger/30";
  return "bg-bg-tertiary text-text-secondary border-border";
};

const payoutMethodLabel = (method: string) => {
  const map: Record<string, string> = { stripe: "Stripe", bank_transfer: "Bank Transfer", bank: "Bank Transfer", paypal: "PayPal" };
  return map[method?.toLowerCase()] ?? method ?? "-";
};

const payoutMethodIcon = (method: string) => {
  const m = method?.toLowerCase();
  if (m === "stripe") return "💳";
  if (m === "bank_transfer" || m === "bank") return "🏦";
  if (m === "paypal") return "🔵";
  return "💰";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Invalid date";
  }
};

const WithdrawTab: React.FC<WithdrawTabProps> = ({
  totalRevenue     = 0,
  thisMonthRevenue = 0,
  pendingRevenue   = 0,
  completedRevenue = 0,
  currentPage,
  onPageChange,
  onRefresh,
  loading: parentLoading,
}) => {
  const balance  = useStripeBalance();
  const withdraw = useWithdraw(() => {
    balance.refetch();
    toast.success("Withdrawal request submitted!");
  });

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [inputError, setInputError]         = useState("");
  const [selectedMethod, setSelectedMethod] = useState("stripe");
  const [successMsg, setSuccessMsg]         = useState("");

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 5000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const availableDollars = balance.balance
    ? balance.balance.available / 100
    : (pendingRevenue ?? 0);
  const pendingDollars = balance.balance
    ? balance.balance.pending / 100
    : 0;

  const QUICK_AMOUNTS = [10, 25, 50, 100, 250].filter((a) => a <= availableDollars);
  if (availableDollars >= MIN_WITHDRAWAL_DOLLARS) QUICK_AMOUNTS.push(availableDollars);

  const handleQuickAmount = (amount: number) => {
    setWithdrawAmount(Math.min(amount, availableDollars).toFixed(2));
    setInputError("");
  };

  const handleWithdraw = async () => {
    const dollars = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(dollars) || dollars <= 0) { setInputError("Please enter a valid amount"); return; }
    if (dollars < MIN_WITHDRAWAL_DOLLARS) { setInputError(`Minimum withdrawal is ${formatCurrency(MIN_WITHDRAWAL_DOLLARS)}`); return; }
    if (dollars > availableDollars) { setInputError("Insufficient balance"); return; }

    setInputError("");
    const result = await withdraw.submit({ amount: dollars });
    if (result) {
      setSuccessMsg(`Withdrawal of ${formatCurrency(dollars)} submitted successfully!`);
      setWithdrawAmount("");
    } else if (withdraw.error) {
      setInputError(withdraw.error);
    }
  };

  const handleRefreshAll = async () => {
    await balance.refetch();
    await onRefresh?.();
    toast.success("Data refreshed");
  };

  const isLoading = parentLoading || balance.loading;

  return (
    <div className="space-y-6 theme-transition">
      {/* Success banner */}
      {successMsg && (
        <div className="p-4 bg-success-bg border border-success/30 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-success">{successMsg}</p>
        </div>
      )}

      {/* Earnings summary */}
      <div className="bg-card-bg rounded-2xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Earnings Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue",         value: totalRevenue,     bg: "bg-info-bg",     border: "border-info/30",    text: "text-info",    sub: "All-time earnings",      subColor: "text-info" },
            { label: "Available to Withdraw",  value: availableDollars, bg: "bg-success-bg",  border: "border-success/30", text: "text-success", sub: "Ready for withdrawal",   subColor: "text-success" },
            { label: "Completed Revenue",      value: completedRevenue, bg: "bg-bg-secondary", border: "border-border",    text: "text-text-primary", sub: "Already withdrawn", subColor: "text-text-secondary" },
            { label: "This Month",             value: thisMonthRevenue, bg: "bg-warning-bg",  border: "border-warning/30", text: "text-warning", sub: "Current month earnings", subColor: "text-warning" },
          ].map(({ label, value, bg, border, text, sub, subColor }) => (
            <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
              <p className={`text-sm font-medium ${subColor}`}>{label}</p>
              <p className={`text-2xl font-bold ${text} mt-1`}>{formatCurrency(value)}</p>
              <p className={`text-xs ${subColor} mt-1`}>{sub}</p>
            </div>
          ))}
        </div>

        {balance.balance && (
          <div className="mt-4 p-3 bg-bg-secondary rounded-lg border border-border flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              <span className="font-medium">Stripe Balance:</span>{" "}
              Available <span className="font-semibold text-success">{balance.balance.formatted.available}</span>
              {" · "}
              Pending <span className="font-semibold text-warning">{balance.balance.formatted.pending}</span>
            </div>
            <button onClick={handleRefreshAll} disabled={isLoading}
              className="text-xs text-accent hover:text-accent-hover disabled:opacity-50 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Withdrawal stats */}
      <div className="bg-card-bg rounded-2xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Withdrawal Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Platform Fee (10%)", value: formatCurrency(totalRevenue * 0.1), sub: "Deducted from earnings" },
            { label: "Net Earnings",       value: formatCurrency(totalRevenue * 0.9), sub: "After 10% fee" },
            { label: "In Escrow",          value: formatCurrency(pendingDollars),     sub: "Awaiting completion" },
            { label: "Pending Payouts",    value: String(balance.payouts.filter((p) => p.status === "pending" || p.status === "processing").length), sub: "Being processed" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-bg-secondary rounded-xl p-4">
              <p className="text-sm font-medium text-text-secondary">{label}</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
              <p className="text-xs text-text-tertiary mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-card-bg rounded-2xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: "stripe",        icon: "💳", name: "Stripe Balance",  desc: "Transfer to your Stripe account",         available: true },
            { id: "bank_transfer", icon: "🏦", name: "Bank Transfer",   desc: "Direct transfer (3-5 business days)",     available: true },
            { id: "paypal",        icon: "🔵", name: "PayPal",          desc: "Transfer to your PayPal account",         available: false, why: "Coming soon" },
          ].map((m) => (
            <div key={m.id} onClick={() => m.available && setSelectedMethod(m.id)}
              className={`p-4 border rounded-xl transition-all ${
                !m.available
                  ? "opacity-50 cursor-not-allowed border-border"
                  : selectedMethod === m.id
                  ? "border-accent bg-warning-bg cursor-pointer"
                  : "border-border cursor-pointer hover:border-accent"
              }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text-primary text-sm">{m.name}</p>
                    {selectedMethod === m.id && <span className="text-success text-xs">✓ Selected</span>}
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{m.desc}</p>
                  {!m.available && (m as any).why && <p className="text-xs text-danger mt-0.5">{(m as any).why}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal form */}
      <div className="bg-card-bg rounded-2xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-1">Request Withdrawal</h3>
        <p className="text-sm text-text-tertiary mb-6">Transfer funds to your preferred payment method</p>

        <div className="space-y-6">
          {QUICK_AMOUNTS.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Quick Amounts</label>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amt, i) => (
                  <button key={i} onClick={() => handleQuickAmount(amt)}
                    className="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-xl text-sm font-medium text-text-secondary transition-colors">
                    {i === QUICK_AMOUNTS.length - 1 && amt === availableDollars ? "All Available" : formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Withdrawal Amount</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-text-tertiary text-sm">$</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => { setWithdrawAmount(e.target.value); setInputError(""); }}
                placeholder="Enter amount"
                min={MIN_WITHDRAWAL_DOLLARS}
                step="0.01"
                max={availableDollars}
                className="pl-8 pr-16 py-3 w-full border border-input-border bg-input-bg text-text-primary placeholder-text-tertiary rounded-xl focus:border-input-focus focus:ring-accent/40 focus:ring-2 focus:outline-none"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-text-tertiary text-sm">USD</span>
            </div>
            <div className="flex justify-between text-sm mt-1.5">
              <span className="text-text-tertiary">Available: <span className="font-semibold text-text-primary">{formatCurrency(availableDollars)}</span></span>
              <span className="text-text-tertiary">Minimum: <span className="font-semibold text-text-primary">{formatCurrency(MIN_WITHDRAWAL_DOLLARS)}</span></span>
            </div>
            {inputError && <p className="text-sm text-danger mt-1">{inputError}</p>}
          </div>

          <button onClick={handleWithdraw}
            disabled={!withdrawAmount || withdraw.loading || availableDollars < MIN_WITHDRAWAL_DOLLARS || !selectedMethod}
            className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-btn-primary-text font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            {withdraw.loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing…
              </>
            ) : (
              `Withdraw ${withdrawAmount ? formatCurrency(parseFloat(withdrawAmount)) : "Funds"}`
            )}
          </button>

          <div className="bg-info-bg border border-info/30 rounded-xl p-4 flex gap-3">
            <svg className="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <ul className="text-sm text-info space-y-1">
              <li>• Withdrawals are processed within 1-3 business days</li>
              <li>• Minimum withdrawal is {formatCurrency(MIN_WITHDRAWAL_DOLLARS)}</li>
              <li>• Platform fee of 10% is already deducted from your earnings</li>
              <li>• No additional withdrawal fees for sellers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-card-bg rounded-2xl shadow-sm border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Payout History</h3>
            <p className="text-sm text-text-tertiary mt-0.5">Track your past withdrawals and payouts</p>
          </div>
          <span className="text-sm text-text-tertiary">{balance.payouts.length} payouts</span>
        </div>

        {balance.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" />
          </div>
        ) : balance.payouts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    {["Date", "Amount", "Status", "Method", "Ref"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {balance.payouts.map((p: Payout, i: number) => (
                    <tr key={p.payoutId ?? p.id ?? i} className="hover:bg-bg-secondary transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap">
                        {formatDate(p.createdAt)}
                        {p.arrivalDate && <p className="text-xs text-text-tertiary">Est: {formatDate(p.arrivalDate)}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text-primary whitespace-nowrap">
                        {p.formattedAmount ?? formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap">
                        <span className="mr-1">{payoutMethodIcon(p.method)}</span>
                        {payoutMethodLabel(p.method)}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-tertiary font-mono whitespace-nowrap">
                        {p.payoutId?.slice(-8) ?? "-"}
                        {p.failureMessage && <p className="text-danger text-xs">{p.failureMessage}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {balance.payouts.length > 10 && (
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
                  className="px-3 py-1.5 text-sm border border-border text-text-secondary rounded-lg hover:bg-bg-secondary disabled:opacity-50">
                  Previous
                </button>
                <button onClick={() => onPageChange(currentPage + 1)}
                  className="px-3 py-1.5 text-sm border border-border text-text-secondary rounded-lg hover:bg-bg-secondary">
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <div className="text-5xl mb-4 text-text-tertiary">💸</div>
            <h3 className="text-lg font-medium text-text-primary">No Payout History</h3>
            <p className="mt-2 text-text-tertiary mb-4">Complete your first order to start earning!</p>
            {availableDollars >= MIN_WITHDRAWAL_DOLLARS && (
              <button onClick={() => handleQuickAmount(10)}
                className="px-6 py-2 bg-accent hover:bg-accent-hover text-btn-primary-text rounded-lg transition-all">
                Make Your First Withdrawal
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawTab;
