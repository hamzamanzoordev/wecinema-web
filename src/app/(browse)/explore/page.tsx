import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { CollectionFaq } from "@/components/seo/CollectionFaq";
import { VideoGrid } from "@/features/videos/components/VideoGrid";
import { getAllVideos } from "@/features/videos/api/videoQueries";
import { CATEGORIES, THEMES, RATINGS, RATING_META } from "@/lib/constants";
import { OG, SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 300;

const SITE = SITE_ORIGIN;
const TITLE = "Explore Independent Films: Browse the Full Catalog | WeCinema";
const DESCRIPTION =
  "Browse every independent film on WeCinema. Discover indie movies and short films by genre, theme and rating, from new and established filmmakers.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/explore" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/explore`,
    images: [{ url: OG.explore, width: 1200, height: 630, alt: "Explore independent films on WeCinema" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.explore],
  },
};

const FAQS = [
  {
    q: "What can I watch on WeCinema?",
    a: "WeCinema hosts independent films and short films uploaded directly by their filmmakers: features, shorts and documentaries across nine genres. Browsing and watching are free; some titles are offered as paid rentals or for sale by the creator.",
  },
  {
    q: "How do I find films by genre or theme?",
    a: "Use the genre links for categories like horror, drama and documentary, or browse by theme (love, redemption, survival, revenge and more) to find films by what they are actually about rather than how they are marketed.",
  },
  {
    q: "Are the films on WeCinema free to watch?",
    a: "Most of the catalog streams free. Individual creators can put a title up for rental or sale, and those are marked on the film's page.",
  },
  {
    q: "Can I upload my own film?",
    a: "Yes. Any filmmaker can upload a film or short to WeCinema, build an audience, and list it for sale or licensing on the marketplace.",
  },
];

const pill = {
  padding: "7px 14px",
  borderRadius: 9999,
  border: "1px solid var(--color-divider)",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  textDecoration: "none",
} as const;

/**
 * The catalog browse hub.
 *
 * This route previously rendered the PayPal subscription checkout while its
 * title, its inbound links (homepage hero, footer, bottom nav, every
 * genre/theme/rating breadcrumb) and `llms.txt` all described a film catalog.
 * The checkout now lives at `/pricing`; this page delivers what those links
 * promise, and renders its film links server-side so crawlers can follow them.
 */
export default async function ExplorePage() {
  const videos = await getAllVideos();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Explore Independent Films",
          description: DESCRIPTION,
          url: `${SITE}/explore`,
          isPartOf: { "@type": "WebSite", name: "WeCinema", url: `${SITE}/` },
          ...(videos.length > 0
            ? {
                mainEntity: {
                  "@type": "ItemList",
                  numberOfItems: videos.length,
                  itemListElement: videos.slice(0, 50).map((v, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    url: `${SITE}/watch/${v.slug ?? v._id}`,
                    name: v.title,
                  })),
                },
              }
            : {}),
        }}
      />

      <div style={{ padding: "32px 24px" }}>
        <header style={{ marginBottom: 24 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-accent-primary)",
            }}
          >
            Catalog
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 800,
              fontFamily: "var(--font-poppins)",
              color: "var(--color-text-primary)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Explore Independent Films
          </h1>
          {videos.length > 0 && (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--color-text-tertiary)" }}>
              {videos.length} film{videos.length !== 1 ? "s" : ""} streaming now
            </p>
          )}
          <p
            style={{
              margin: "14px 0 0",
              maxWidth: 760,
              fontSize: 15,
              lineHeight: 1.65,
              color: "var(--color-text-secondary)",
            }}
          >
            Every independent film on WeCinema, newest first, uploaded directly by the
            filmmakers who made them. Browse the full catalog below, or narrow it down by
            genre, theme or rating.
          </p>
        </header>

        <nav aria-label="Browse by genre" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "var(--color-text-primary)" }}>
            Browse by genre
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CATEGORIES.map((c) => (
              <Link key={c} href={`/category/${c.toLowerCase()}`} style={pill} className="hover:!border-[var(--color-accent-primary)]">
                {c} Films
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Browse by theme" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "var(--color-text-primary)" }}>
            Browse by theme
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {THEMES.map((t) => (
              <Link key={t} href={`/themes/${t.toLowerCase()}`} style={pill} className="hover:!border-[var(--color-accent-primary)]">
                {t}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Browse by rating" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "var(--color-text-primary)" }}>
            Browse by rating
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {RATINGS.map((r) => (
              <Link key={r} href={`/ratings/${r}`} style={pill} className="hover:!border-[var(--color-accent-primary)]">
                {r}: {RATING_META[r]?.label ?? r}
              </Link>
            ))}
          </div>
        </nav>

        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "var(--color-text-primary)" }}>
          All films
        </h2>
        <VideoGrid videos={videos} emptyMessage="No films in the catalog yet." />

        <CollectionFaq heading="Exploring WeCinema: FAQ" faqs={FAQS} />

        <nav aria-label="More on WeCinema" style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "var(--color-text-primary)" }}>
            More on WeCinema
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/shorts" style={pill} className="hover:!border-[var(--color-accent-primary)]">Short films</Link>
            <Link href="/scripts" style={pill} className="hover:!border-[var(--color-accent-primary)]">Screenplays &amp; scripts</Link>
            <Link href="/marketplace" style={pill} className="hover:!border-[var(--color-accent-primary)]">Marketplace</Link>
            <Link href="/pricing" style={pill} className="hover:!border-[var(--color-accent-primary)]">Pricing</Link>
            <Link href="/blog" style={pill} className="hover:!border-[var(--color-accent-primary)]">Blog</Link>
          </div>
        </nav>
      </div>
    </>
  );
}
