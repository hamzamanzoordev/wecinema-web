import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoGrid } from "@/features/videos/components/VideoGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { CollectionFaq } from "@/components/seo/CollectionFaq";
import { getVideosByCategory } from "@/features/videos/api/videoQueries";
import { CATEGORIES } from "@/lib/constants";
import { getGenreCopy } from "@/lib/collectionSeo";
import { OG, SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 300;

type Params = { genre: string };

export function generateStaticParams(): Params[] {
  return CATEGORIES.map((c) => ({ genre: c.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { genre } = await params;
  const label = genre.charAt(0).toUpperCase() + genre.slice(1);
  const SITE = SITE_ORIGIN;
  const copy = getGenreCopy(genre);

  return {
    title: `${label} Films: Watch Independent ${label} Movies Online`,
    description: copy.description,
    keywords: copy.keywords,
    alternates: { canonical: `/category/${genre}` },
    openGraph: {
      type: "website",
      siteName: "WeCinema",
      title: `${label} Films | WeCinema`,
      description: copy.description,
      url: `${SITE}/category/${genre}`,
      images: [{ url: OG.default, width: 1200, height: 630, alt: `${label} films on WeCinema` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} Films | WeCinema`,
      description: `Stream independent ${label.toLowerCase()} films on WeCinema.`,
      images: [OG.default],
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { genre } = await params;

  if (!genre || genre.length > 60 || !/^[a-z0-9-]+$/i.test(genre)) notFound();

  const label = genre.charAt(0).toUpperCase() + genre.slice(1);
  const SITE = SITE_ORIGIN;
  const copy = getGenreCopy(genre);
  const videos = await getVideosByCategory(label, 100);
  const others = CATEGORIES.filter((c) => c.toLowerCase() !== genre.toLowerCase());

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${label} Films`,
          description: copy.description,
          url: `${SITE}/category/${genre}`,
          isPartOf: { "@type": "WebSite", name: "WeCinema", url: SITE },
          ...(videos.length > 0
            ? {
                mainEntity: {
                  "@type": "ItemList",
                  numberOfItems: videos.length,
                  itemListElement: videos.slice(0, 20).map((v, i) => ({
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
        <div style={{ marginBottom: 12 }}>
          <Breadcrumbs items={[{ name: "Genres", href: "/explore" }, { name: `${label} Films` }]} />
        </div>
        <div style={{ marginBottom: 20 }}>
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
            Genre
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

        <VideoGrid videos={videos} emptyMessage={`No ${label.toLowerCase()} films yet.`} />

        <CollectionFaq heading={`${label} films: FAQ`} faqs={copy.faqs} />

        {/* Internal linking — pass authority across the genre cluster + aid discovery */}
        <nav aria-label="Browse other genres" style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "var(--color-text-primary)" }}>
            Browse other genres
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {others.map((c) => (
              <Link
                key={c}
                href={`/category/${c.toLowerCase()}`}
                style={{
                  padding: "7px 14px",
                  borderRadius: 9999,
                  border: "1px solid var(--color-divider)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  textDecoration: "none",
                }}
                className="hover:!border-[var(--color-accent-primary)]"
              >
                {c} Films
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
