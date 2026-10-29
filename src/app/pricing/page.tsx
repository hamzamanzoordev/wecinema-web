import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { CollectionFaq } from "@/components/seo/CollectionFaq";
import { clientEnv } from "@/config/env";
import { OG, SITE_ORIGIN } from "@/lib/seo";
import { ExploreContent } from "@/app/explore/ExploreContent";

const SITE = SITE_ORIGIN;
const TITLE = "Pricing: WeCinema Plans for Creators & Buyers";
const DESCRIPTION =
  "WeCinema pricing: free to watch and browse. Basic is $5/month and Pro is $10/month to buy, sell and list films and scripts. Sellers pay a 15% fee on sales only.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | WeCinema` },
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/pricing`,
    images: [{ url: OG.explore, width: 1200, height: 630, alt: "WeCinema pricing plans" }],
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

/**
 * Canonical subscription page.
 *
 * This checkout used to live at `/explore`, whose title and inbound links all
 * promised a film catalog — so upgrade-intent traffic and browse-intent traffic
 * collided on one URL and neither converted. `/explore` is now the catalog;
 * this is the paid plan page.
 *
 * The prices below must stay in step with `PLANS` in `ExploreContent.tsx` and
 * with the pricing line in `llms.txt`.
 */
const FAQS = [
  {
    q: "How much does WeCinema cost?",
    a: "Watching and browsing WeCinema is free. Paid plans are $5/month (Basic) and $10/month (Pro). Selling costs nothing up front. WeCinema takes a 15% fee on a sale only when it completes.",
  },
  {
    q: "What is the difference between the Basic and Pro plans?",
    a: "Basic ($5/month) lets you buy and sell films and scripts with basic support and 5GB of storage. Pro ($10/month) is built for studios and high-volume creators, adding more storage and priority support.",
  },
  {
    q: "Do I need a subscription to sell on WeCinema?",
    a: "You need a paid plan to list on the marketplace. There is no listing fee and no up-front cost beyond the subscription. WeCinema earns its 15% only when your work sells.",
  },
  {
    q: "How do sellers get paid?",
    a: "Payments run through Stripe with escrow protection. A buyer's funds are authorised at purchase and released to you once delivery is confirmed, so neither side is exposed.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. Plans are month to month and you can cancel whenever you like. Your listings and uploads stay in your account.",
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "WeCinema Subscription",
          description: DESCRIPTION,
          url: `${SITE}/pricing`,
          image: OG.explore,
          brand: { "@type": "Brand", name: "WeCinema" },
          offers: [
            {
              "@type": "Offer",
              name: "Basic Plan",
              price: "5.00",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: `${SITE}/pricing`,
            },
            {
              "@type": "Offer",
              name: "Pro Plan",
              price: "10.00",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: `${SITE}/pricing`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE}/pricing`,
          isPartOf: { "@type": "WebSite", name: "WeCinema", url: `${SITE}/` },
        }}
      />
      <ExploreContent appUrl={clientEnv.NEXT_PUBLIC_APP_URL} />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 56px" }}>
        <CollectionFaq heading="Pricing: FAQ" faqs={FAQS} />
      </div>
    </>
  );
}
