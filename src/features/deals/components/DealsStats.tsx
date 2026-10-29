import type { ReactNode } from "react";
import { CheckCircle2, DollarSign, FileText, RefreshCw } from "lucide-react";
import { formatCents } from "../lib/dealFormat";
import type { DealStats } from "../types/deal.types";

function Tile({ icon, color, value, label }: { icon: ReactNode; color: string; value: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-card-border bg-card-bg p-3">
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-bold tabular-nums text-text-primary">{value}</span>
        <span className="block text-[10px] text-text-tertiary">{label}</span>
      </span>
    </div>
  );
}

export function DealsStats({ stats, loading }: { stats: DealStats | null; loading?: boolean }) {
  const v = (n: number | undefined) => (loading && !stats ? "-" : n ?? 0);
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      <Tile icon={<FileText size={15} />} color="var(--color-info)" value={v(stats?.total)} label="Total Deals" />
      <Tile icon={<RefreshCw size={15} />} color="var(--color-accent-primary)" value={v(stats?.active)} label="Active" />
      <Tile icon={<CheckCircle2 size={15} />} color="var(--color-success)" value={v(stats?.completed)} label="Completed" />
      <Tile
        icon={<DollarSign size={15} />}
        color="var(--color-accent-primary)"
        value={loading && !stats ? "-" : formatCents(stats?.totalValueCents ?? 0)}
        label="Total Value"
      />
    </div>
  );
}
