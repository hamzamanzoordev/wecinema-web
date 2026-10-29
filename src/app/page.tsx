import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { JsonLd } from "@/components/seo/JsonLd";
import { OG, SITE_ORIGIN, SOCIAL_PROFILES } from "@/lib/seo";
import { getHomepageData } from "@/features/home/api/homepageQueries";
import { getFeaturedListings } from "@/features/home/api/marketplaceHome";
import { getAnalyticsGraphs } from "@/features/home/api/analyticsGraphs";
import { getLatestScripts } from "@/features/scripts/api/scriptsQueries";
import { HeroSplit, type HeroFeatured } from "@/features/home/components/HeroSplit";
import { ThemePills } from "@/features/videos";
import { ContinueWatchingRow } from "@/features/home/components/ContinueWatchingRow";
import { LatestRow } from "@/features/home/components/LatestRow";
import { TrendingRow } from "@/features/home/components/TrendingRow";
import { ShortsRow } from "@/features/home/components/ShortsRow";
import { MarketplaceSpotlight } from "@/features/home/components/MarketplaceSpotlight";
import { ForCreators } from "@/features/home/components/ForCreators";
import { FaqSection, FAQS } from "@/features/home/components/FaqSection";
import { ScriptsSection } from "@/features/scripts/components/ScriptsSection";
import { resolveThumb } from "@/features/home/lib/posterFallback";
import type { Video } from "@/types";

const HOME_TITLE = "WeCinema – Buy, Sell & Stream Independent Films";
const HOME_DESCRIPTION =
  "Watch independent films, buy and sell on the marketplace, and upload your own films and scripts to earn on WeCinema.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_ORIGIN,
    images: [{ url: OG.default, width: 1200, height: 630, alt: "WeCinema: Independent Film Platform" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG.default],
  },
};

export const revalidate = 300;

function toHeroFeatured(v: Video): HeroFeatured {
  const genre = Array.isArray(v.genre) ? v.genre[0] : v.genre;
  return {
    id: v._id,
    title: v.title,
    tagline: v.description,
    href: `/watch/${v.slug ?? v._id}`,
    image: resolveThumb(v.thumbnail ?? v.thumbnailSmall),
    video: v.file,
    redCarpet: Boolean(v.red_carpet),
    genre: genre || undefined,
    rating: v.rating || undefined,
    views: v.views,
  };
}

export default async function HomePage() {
  const SITE = SITE_ORIGIN;

  // Parallel data fetch — one /video/all call powers hero + trending + genres;
  // marketplace and scripts each add one cached call.
  const [home, marketplace, scripts, graphs] = await Promise.all([
    getHomepageData(),
    getFeaturedListings(8),
    getLatestScripts(8),
    getAnalyticsGraphs(),
  ]);

  const heroFeatured = home.featured.map(toHeroFeatured);

  return (
    <Layout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "WeCinema",
          url: SITE,
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${SITE}/search/{search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "WeCinema",
          alternateName: "Wecinema",
          url: SITE,
          logo: {
            "@type": "ImageObject",
            url: `${SITE}/wecinema.webp`,
            width: 512,
            height: 512,
          },
          description: HOME_DESCRIPTION,
          foundingDate: "2024",
          knowsAbout: [
            "Independent Film",
            "Indie Film Distribution",
            "Film Marketplace",
            "Screenplay Sales",
            "Film Licensing",
            "Short Film Streaming",
          ],
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            url: `${SITE}/support`,
            availableLanguage: "English",
          },
          sameAs: [...SOCIAL_PROFILES],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      {/* Section 1 — Split hero: featured film + always-on live platform graph.
          The hero renders the page's visible <h1>. */}
      <HeroSplit featured={heroFeatured} graphs={graphs} />

      {/* Browse-by-theme bar, directly under the hero */}
      <ThemePills />

      <main id="main-content">
        {/* Continue watching — auth-only, hides when empty. Stays bare (no
            divider Section) so it never leaves an empty hairline. */}
        <ContinueWatchingRow />

        {/* Content first — discovery before pitch (premium / industry-scale) */}
        <LatestRow videos={home.latest} />
        <TrendingRow videos={home.trending} />
        <ShortsRow videos={home.shorts} />

        {/* Commerce you can act on */}
        <MarketplaceSpotlight listings={marketplace.listings} />
        <ScriptsSection scripts={scripts} />

        {/* One merged explain + convert block (Why + How it works + Creator CTA) */}
        <ForCreators />

        {/* FAQ */}
        <FaqSection />
      </main>
    </Layout>
  );
}
