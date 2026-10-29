import type { Metadata } from "next";

// Client-component page — metadata lives here so the route is indexable with a
// self-referencing canonical instead of inheriting the homepage canonical.
export const metadata: Metadata = {
  title: { absolute: "How to Sell Your Film or Script Online | WeCinema Guide" },
  description:
    "Step-by-step guide to selling films, scripts, and rights online on WeCinema: how listings, offers, orders, escrow payouts, and platform fees work.",
  alternates: { canonical: "/marketplace/guide" },
};

export default function MarketplaceGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
