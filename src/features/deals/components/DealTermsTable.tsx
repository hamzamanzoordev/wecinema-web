import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import {
  dealTypeLabel,
  deliveryLabel,
  exclusivityLabel,
  paymentTypeLabel,
  rightsLabel,
  termLabel,
  territoryLabel,
} from "../lib/dealFormat";
import type { DealTerms } from "../types/deal.types";

export function DealTermsTable({ terms, listingId }: { terms: DealTerms; listingId?: string }) {
  const rows: [string, string][] = [
    ["Deal Type", dealTypeLabel(terms.dealType)],
    ["Rights", rightsLabel(terms.rights)],
    ["Territory", territoryLabel(terms.territory)],
    ["Term Length", termLabel(terms.termMonths)],
    ["Exclusivity", exclusivityLabel(terms.exclusivity)],
    ["Payment Type", paymentTypeLabel(terms.paymentType)],
    ["Delivery Materials", deliveryLabel(terms.deliveryMaterials)],
    ["Additional Notes", terms.notes?.trim() || "-"],
  ];

  return (
    <section className="mp-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <FileText size={15} className="text-text-secondary" aria-hidden="true" />
          Deal Terms
        </h3>
        {listingId && (
          <Link href={`/marketplace/listings/${listingId}`} className="mp-btn mp-btn-secondary mp-btn-sm !h-7 !px-2.5 !text-[11px]">
            View Listing <ArrowRight size={12} aria-hidden="true" />
          </Link>
        )}
      </div>
      <dl className="divide-y divide-divider rounded-lg border border-divider">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(0,40%)_minmax(0,1fr)] gap-3 px-3 py-2 sm:grid-cols-[180px_minmax(0,1fr)]">
            <dt className="text-xs text-text-tertiary">{label}</dt>
            <dd className="whitespace-pre-wrap break-words text-xs text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
