import type { Metadata } from "next";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const TITLE = "My Rentals: Films You've Rented | WeCinema";
const DESCRIPTION =
  "Your rented independent films on WeCinema. Rent a film from any creator and watch it for the length of the rental window.";

/**
 * The page itself redirects unauthenticated visitors to login, so its content
 * is per-user — but it was inheriting the root title and `index, follow`.
 * Give it a real title and keep it out of the index.
 */
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: "/rentals" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/rentals`,
    images: [{ url: OG.default, width: 1200, height: 630, alt: "Rentals on WeCinema" }],
  },
};

export default function RentalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
