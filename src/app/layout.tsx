import type { Metadata, Viewport } from "next";
import { Poppins, Roboto } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import { clientEnv } from "@/config/env";
import { OG } from "@/lib/seo";
import "./globals.css";

// Preload only the most-used weight eagerly; remaining weights load on swap.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: true,
});

const poppinsExtra = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
  display: "swap",
  preload: false,
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const SITE_NAME = "WeCinema";
// NEXT_PUBLIC_* is inlined at build time — if the build env had a stale/dev
// value baked in, fall back to production rather than shipping a localhost
// canonical/metadataBase to every page. Mirrors the guard in robots.ts/sitemap.ts.
const rawSiteUrl = clientEnv.NEXT_PUBLIC_SITE_URL ?? "";
const SITE_URL = (/localhost/i.test(rawSiteUrl) ? "https://wecinema.co" : rawSiteUrl || "https://wecinema.co").replace(/\/$/, "");
const DESCRIPTION =
  "WeCinema is the home of independent film. Watch movies, upload your own, browse scripts, and sell your work to a global audience.";

// Runs synchronously during HTML parse — BEFORE first paint — so the correct
// theme is applied up front. Without this, the server ships data-theme="light"
// and ThemeProvider only switches to the saved/system theme after hydration,
// producing a visible light→dark flash that reads as the page "loading twice".
// Keep in sync with ThemeProvider's STORAGE_KEY ("wc_theme").
// Also flags the Halloween season (Oct 1 – Nov 1, visitor's local date) via
// data-season. All seasonal styling/decor is CSS-gated on that attribute, so it
// turns itself off after Halloween with no deploy and no hydration mismatch.
const THEME_INIT_SCRIPT = `(function(){var e=document.documentElement;try{var d=new Date(),mo=d.getMonth(),da=d.getDate();if(mo===9||(mo===10&&da===1))e.setAttribute('data-season','halloween');}catch(x){}try{var m=localStorage.getItem('wc_theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');e.setAttribute('data-theme',m);e.style.colorScheme=m;}catch(x){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: Watch, Create & Sell Films and Scripts Online`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "independent films",
    "film marketplace",
    "watch movies online",
    "sell scripts",
    "indie cinema",
    "film community",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  // No canonical here: a root-layout canonical is INHERITED by every descendant
  // page that doesn't set its own, making Google treat them as duplicates of "/".
  // The homepage (app/page.tsx) sets its own canonical: "/"; other pages set theirs.
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME}: Watch, Create & Sell Films`,
    description: DESCRIPTION,
    images: [{ url: OG.default, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}: Watch, Create & Sell Films`,
    description: DESCRIPTION,
    images: [OG.default],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: "jHqhnnIBc46TMhJgBRGRwqAL0Lb1U_UJHF_TsjoveNs",   // Google Search Console → Verify → HTML tag → content="..."
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${poppins.variable} ${poppinsExtra.variable} ${roboto.variable}`}
    >
      <body>
        {/* Pre-hydration theme setter — must be the first thing in <body> so it
            executes before the page paints (prevents the theme-flash / "double
            load"). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Providers also mounts the consent banner and the consent-gated trackers. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
