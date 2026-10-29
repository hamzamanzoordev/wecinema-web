import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { OG, SITE_ORIGIN, SOCIAL_PROFILES } from "@/lib/seo";
import WelcomeLanding from "./WelcomeLanding";

const TITLE = "WeCinema: Buy, Sell & Stream Independent Films";
const DESCRIPTION =
  "Join WeCinema, the home of independent film. Upload your films, sell scripts, license rights, and earn, protected by Stripe escrow. Free to join, fee on sales only.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "sell films online",
    "film marketplace",
    "buy independent films",
    "sell movie scripts",
    "license film rights",
    "indie filmmaker platform",
    "stream independent cinema",
    "video creator marketplace",
  ],
  alternates: { canonical: "/welcome" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/welcome`,
    images: [{ url: OG.default, width: 1200, height: 630, alt: "WeCinema: Independent Film Marketplace" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.default],
  },
};

export default function WelcomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "WeCinema",
          url: SITE_ORIGIN,
          description: DESCRIPTION,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "WeCinema",
          url: SITE_ORIGIN,
          logo: `${SITE_ORIGIN}/wecinema.webp`,
          sameAs: [...SOCIAL_PROFILES],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Is WeCinema free to join?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Creating an account, browsing, and listing your work is free. Sellers only pay a platform fee when a sale completes.",
              },
            },
            {
              "@type": "Question",
              name: "How are payments protected?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Every order is protected by Stripe escrow. Funds are authorized when an order is placed and only released to the seller after the buyer confirms delivery.",
              },
            },
            {
              "@type": "Question",
              name: "What can I sell on WeCinema?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "You can sell finished films, license commercial and broadcast rights, sell adaptation rights for remakes and sequels, or take on custom commissions: four marketplace models in one platform.",
              },
            },
          ],
        }}
      />
      <WelcomeLanding />
    </>
  );
}
