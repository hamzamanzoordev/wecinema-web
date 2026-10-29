import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoGrid } from "@/features/videos/components/VideoGrid";
import { ThemePills } from "@/features/videos/components/ThemePills";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { CollectionFaq } from "@/components/seo/CollectionFaq";
import { getVideosByTheme } from "@/features/videos/api/videoQueries";
import { THEMES } from "@/lib/constants";
import { getThemeCopy } from "@/lib/collectionSeo";
import { OG, SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 300;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return THEMES.map((t) => ({ slug: t.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const label = slug.charAt(0).toUpperCase() + slug.slice(1);
  const SITE = SITE_ORIGIN;
  const copy = getThemeCopy(slug);

  return {
    title: `${label} Films: Independent Movies About ${label}`,
    description: copy.description,
    keywords: copy.keywords,
    alternates: { canonical: `/themes/${slug}` },
    openGraph: {
      type: "website",
      siteName: "WeCinema",
      title: `${label} Films | WeCinema`,
      description: copy.description,
      url: `${SITE}/themes/${slug}`,
      images: [{ url: OG.default, width: 1200, height: 630, alt: `${label} themed films` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} Films | WeCinema`,
      description: `Films about ${label.toLowerCase()} from independent filmmakers on WeCinema.`,
      images: [OG.default],
    },
  };
}

export default async function ThemePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const isKnown = THEMES.some((t) => t.toLowerCase() === slug.toLowerCase());
  if (!isKnown) notFound();

  const label = slug.charAt(0).toUpperCase() + slug.slice(1);
  const SITE = SITE_ORIGIN;
  const copy = getThemeCopy(slug);
  const videos = await getVideosByTheme(label);

  return (
    <>
      <ThemePills active={label} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${label} Films`,
          description: copy.description,
          url: `${SITE}/themes/${slug}`,
          isPartOf: { "@type": "WebSite", name: "WeCinema", url: SITE },
        }}
      />

      <div
        style={{
          background: "linear-gradient(135deg, var(--color-accent-primary,#FFBB00)15, var(--color-bg-elevated))",
          borderBottom: "1px solid var(--color-divider)",
          padding: "28px 24px",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Breadcrumbs items={[{ name: "Themes", href: "/explore" }, { name: `${label} Films` }]} />
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
          Theme
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
          {label} Films
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
          {copy.intro}
        </p>
      </div>

      <div style={{ padding: "28px 24px" }}>
        <VideoGrid videos={videos} emptyMessage={`No films with theme "${label}" yet.`} />
        <CollectionFaq heading={`Films about ${label.toLowerCase()}: FAQ`} faqs={copy.faqs} />
      </div>
    </>
  );
}
