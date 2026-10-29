import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface MediaRowProps {
  title?: string;
  icon?: ReactNode;
  /** Optional "View all" destination shown beside the title. */
  viewAllHref?: string;
  children: ReactNode;
}

/**
 * YouTube-style video grid: 1 column on mobile, 2 on tablet, 3 on desktop.
 */
export function MediaRow({ title, icon, viewAllHref, children }: MediaRowProps) {
  return (
    <section style={{ padding: "20px var(--space-section-x) 28px" }}>
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            margin: "0 0 14px",
          }}
        >
          <h2
            style={{
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: "clamp(1.15rem, 2.2vw, 1.45rem)",
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {icon}
            {title}
          </h2>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-text-link)",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              View all <ChevronRight size={16} aria-hidden />
            </Link>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {children}
      </div>
    </section>
  );
}
