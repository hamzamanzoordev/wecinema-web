import Link from "next/link";
import { ShoppingBag, Tag } from "lucide-react";
import { MediaRow } from "@/features/home/components/MediaRow";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { POSTER_FALLBACK } from "@/features/home/lib/posterFallback";
import type { Listing } from "@/types/marketplace.types";

function priceOf(l: Listing): string {
  if (l.formattedPrice) return l.formattedPrice;
  return `$${(l.price ?? 0).toFixed(2)}`;
}

function thumbOf(l: Listing): string {
  return l.thumbnailUrl ?? l.thumbnail ?? l.mediaUrls?.[0] ?? POSTER_FALLBACK;
}

function SpotlightCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/marketplace/listings/${listing._id}`}
      style={{ textDecoration: "none", display: "block" }}
      className="group/ml"
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "var(--color-skeleton-base)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbOf(listing)}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover/ml:scale-105"
        />
        <span
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            background: "rgba(0,0,0,0.72)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 9999,
          }}
        >
          {priceOf(listing)}
        </span>
      </div>
      <p
        className="line-clamp-1"
        style={{ margin: "8px 0 2px", fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}
      >
        {listing.title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Tag size={11} aria-hidden />
        {(listing.type ?? "for_sale").replaceAll("_", " ")}
      </p>
    </Link>
  );
}

const cta: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 22px",
  borderRadius: 12,
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
};

export function MarketplaceSpotlight({ listings }: { listings: Listing[] }) {
  return (
    <Section maxWidth="content" ariaLabelledby="mp-spotlight-heading">
      <div
        style={{
          borderRadius: 20,
          padding: "clamp(24px, 4vw, 40px)",
          background:
            "radial-gradient(120% 140% at 100% 0%, var(--accent-soft) 0%, transparent 62%), var(--color-bg-elevated)",
          border: "1px solid var(--color-border-secondary)",
        }}
      >
        <SectionHeader
          eyebrow="Marketplace"
          title="Sell your film on WeCinema"
          titleId="mp-spotlight-heading"
          subtitle="Upload your film, set your price, and earn directly from buyers worldwide, with escrow-protected payments."
        />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: listings.length > 0 ? 28 : 0 }}>
          <Link
            href="/marketplace/listings/new"
            style={{ ...cta, background: "var(--color-accent-primary)", color: "var(--color-btn-primary-text,#000)", boxShadow: "0 6px 18px var(--accent-ring)" }}
            className="hover:!brightness-110"
          >
            Sell My Film
          </Link>
          <Link
            href="/marketplace/browse"
            style={{ ...cta, background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-secondary)" }}
            className="hover:!brightness-105"
          >
            <ShoppingBag size={16} /> Browse Marketplace
          </Link>
        </div>

        {listings.length > 0 && (
          <div style={{ margin: "0 -12px" }}>
            <MediaRow>
              {listings.map((l) => (
                <SpotlightCard key={l._id} listing={l} />
              ))}
            </MediaRow>
          </div>
        )}
      </div>
    </Section>
  );
}
