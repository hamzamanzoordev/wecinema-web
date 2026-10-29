import { ArrowRight, DollarSign } from "lucide-react";
import { formatCents } from "../lib/dealFormat";

interface OfferComparisonProps {
  currentCents: number;
  /** NaN / null while the amount field is empty or invalid. */
  counterCents: number | null;
  currentLabel?: string;
  counterLabel?: string;
}

export function OfferComparison({
  currentCents,
  counterCents,
  currentLabel = "Current Offer",
  counterLabel = "Your Counter",
}: OfferComparisonProps) {
  const valid = counterCents != null && Number.isFinite(counterCents) && counterCents > 0;
  const delta = valid ? counterCents - currentCents : 0;

  return (
    <section className="mp-card p-4 sm:p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-text-secondary"
          style={{ backgroundColor: "var(--color-bg-tertiary)" }}
          aria-hidden="true"
        >
          <DollarSign size={12} />
        </span>
        Offer Comparison
      </h3>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <div className="rounded-lg border border-divider bg-bg-secondary px-3 py-2.5">
          <p className="text-[10px] text-text-tertiary">{currentLabel}</p>
          <p className="truncate text-base font-bold tabular-nums text-text-primary sm:text-lg">{formatCents(currentCents)}</p>
        </div>
        <ArrowRight size={16} className="text-text-secondary" aria-hidden="true" />
        <div
          className="rounded-lg border px-3 py-2.5"
          style={{
            borderColor: "var(--color-accent-primary)",
            backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 6%, transparent)",
          }}
          aria-live="polite"
        >
          <p className="text-[10px] text-accent">{counterLabel}</p>
          <p className="truncate text-base font-bold tabular-nums text-accent sm:text-lg">
            {valid ? formatCents(counterCents) : "-"}
          </p>
        </div>
      </div>
      {valid && delta !== 0 && (
        <p className="mt-2 text-right text-[11px] text-text-tertiary">
          {delta > 0 ? "+" : "−"}
          {formatCents(Math.abs(delta))} vs current offer
        </p>
      )}
    </section>
  );
}
