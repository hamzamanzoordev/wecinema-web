import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoGrid } from "@/features/videos/components/VideoGrid";
import { TrendingTags } from "@/features/videos/components/TrendingTags";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { getVideosByTag, getTrendingTags } from "@/features/videos/api/videoQueries";
import { displayTag, slugifyTag } from "@/lib/tags";
import { OG, SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 300;

type Params = { tag: string };

/**
 * Hashtag feed — every public video carrying a tag, plus the rail of trending
 * tags so the page is a place to keep browsing rather than a dead end.
 *
 * Tags are creator-supplied and unbounded, so these pages are rendered on
 * demand (no generateStaticParams) and revalidated every 5 minutes.
 */

async function resolve(params: Promise<Params>) {
  const { tag } = await params;
  const slug = slugifyTag(decodeURIComponent(tag));
  if (!slug) notFound();
  return slug;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const slug = await resolve(params);
  const feed = await getVideosByTag(slug);
  const label = feed.label || slug;
  const pretty = displayTag(label);

  const description = feed.total
    ? `Watch ${feed.total} film${feed.total === 1 ? "" : "s"} tagged ${pretty} on WeCinema: independent shorts and features from creators worldwide.`
    : `Films tagged ${pretty} on WeCinema. Browse independent shorts and features by hashtag.`;

  return {
    title: `${pretty}: Films Tagged ${label} | WeCinema`,
    description,
    keywords: [label, `${label} films`, `${label} videos`, "hashtag", "independent film"],
    alternates: { canonical: `/tags/${slug}` },
    // A tag with nothing in it yet is a thin page; keep it out of the index
    // until creators fill it, but still let crawlers follow its links.
    robots: feed.total === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: "WeCinema",
      title: `${pretty} | WeCinema`,
      description,
      url: `${SITE_ORIGIN}/tags/${slug}`,
      images: [{ url: OG.default, width: 1200, height: 630, alt: `Films tagged ${label}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pretty} | WeCinema`,
      description,
      images: [OG.default],
    },
  };
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const slug = await resolve(params);
  const [feed, trending] = await Promise.all([getVideosByTag(slug), getTrendingTags(20)]);

  const label = feed.label || slug;
  const pretty = displayTag(label);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Films tagged ${pretty}`,
          url: `${SITE_ORIGIN}/tags/${slug}`,
          isPartOf: { "@type": "WebSite", name: "WeCinema", url: SITE_ORIGIN },
        }}
      />

      <div
        style={{
          background:
            "linear-gradient(135deg, var(--color-accent-primary,#FFBB00)15, var(--color-bg-elevated))",
          borderBottom: "1px solid var(--color-divider)",
          padding: "28px 24px",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Breadcrumbs items={[{ name: "Explore", href: "/explore" }, { name: pretty }]} />
        </div>
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
          Hashtag
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
            overflowWrap: "anywhere",
          }}
        >
          {pretty}
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--color-text-tertiary)" }}>
          {feed.total > 0
            ? `${feed.total.toLocaleString()} video${feed.total === 1 ? "" : "s"}`
            : "No videos yet. Be the first to use this hashtag."}
        </p>
      </div>

      <div style={{ padding: "22px 24px 28px" }}>
        {trending.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <TrendingTags tags={trending} active={slug} />
          </div>
        )}
        <VideoGrid
          videos={feed.videos}
          emptyMessage={`No videos tagged ${pretty} yet.`}
        />
      </div>
    </>
  );
}
