"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

/**
 * Site footer = the site-wide internal-linking hub.
 *
 * Beyond branding, this footer exists for SEO: it gives every page a persistent
 * set of contextual links into the main content clusters (discover, genres,
 * marketplace, company). That distributes PageRank, gives crawlers a reliable
 * path to otherwise-orphaned pages (themes, seller guide, resources), and
 * reinforces the site's topic structure. Keep links real and crawlable (<Link>).
 */

interface FooterLink {
  label: string;
  href: string;
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Discover",
    links: [
      { label: "Explore Films", href: "/explore" },
      { label: "HypeMode", href: "/hypemode" },
      { label: "Film Scripts", href: "/scripts" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Top Genres",
    // Link the highest-intent genres directly (rest reachable via each genre page).
    links: ["Action", "Drama", "Horror", "Comedy", "Documentary"]
      .filter((g) => (CATEGORIES as readonly string[]).includes(g))
      .map((g) => ({ label: `${g} Films`, href: `/category/${g.toLowerCase()}` })),
  },
  {
    title: "Marketplace",
    links: [
      { label: "Browse Listings", href: "/marketplace/browse" },
      { label: "Sell Your Film", href: "/marketplace/listings/new" },
      { label: "Seller Guide", href: "/marketplace/guide" },
      { label: "Resources", href: "/marketplace/resources" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Support", href: "/support" },
      { label: "Report Content", href: "/report" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms-and-conditions" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{
        backgroundColor: "var(--color-nav-bg)",
        borderTop: "1px solid var(--color-divider)",
        color: "var(--color-text-tertiary)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 24px",
          display: "grid",
          gap: 32,
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        }}
      >
        {/* Brand blurb */}
        <div style={{ gridColumn: "1 / -1", maxWidth: 360 }}>
          <Link
            href="/"
            style={{ fontSize: 18, fontWeight: 800, color: "var(--color-accent-primary)", textDecoration: "none" }}
          >
            WeCinema
          </Link>
          <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--color-text-tertiary)" }}>
            The home of independent film. Watch movies, upload your own, browse scripts, and sell your
            work to a global audience.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-text-secondary)",
              }}
            >
              {col.title}
            </h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{ fontSize: 13, color: "var(--color-text-tertiary)", textDecoration: "none" }}
                    className="hover:!text-[var(--color-accent-primary)] hover:!underline underline-offset-2"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--color-divider)",
          padding: "16px 24px",
          textAlign: "center",
          fontSize: 12,
          letterSpacing: "0.02em",
        }}
      >
        © {new Date().getFullYear()} WeCinema. All rights reserved.{" "}
        <a
          href="https://wecinema.co"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline underline-offset-2"
          style={{ color: "var(--color-accent-primary)" }}
        >
          wecinema.co
        </a>
      </div>
    </footer>
  );
}
