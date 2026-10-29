import type { Metadata } from "next";
import Link from "next/link";
import {
  FaStore, FaShoppingCart, FaHandshake, FaShieldAlt,
  FaCreditCard, FaComments, FaChartLine, FaUserPlus,
  FaSearch, FaBolt,
} from "react-icons/fa";
import { JsonLd } from "@/components/seo/JsonLd";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const SITE = SITE_ORIGIN;
const TITLE = "Independent Film Marketplace: Buy, Sell & License Films | WeCinema";
const DESCRIPTION =
  "Buy, sell, and license independent films, scripts, and adaptation rights directly from creators, protected by Stripe escrow. Free to join on WeCinema.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/marketplace" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/marketplace`,
    images: [{ url: OG.marketplace, width: 1200, height: 630, alt: "WeCinema Marketplace" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.marketplace],
  },
};

const SELLER_STEPS = [
  { n: 1, icon: <FaUserPlus />, title: "Create an Account", desc: "Sign up free and choose the seller role." },
  { n: 2, icon: <FaStore />,   title: "List Your Content", desc: "Add your film or script with pricing, description, and requirements." },
  { n: 3, icon: <FaComments />, title: "Receive Offers",   desc: "Buyers send offers and messages directly to you." },
  { n: 4, icon: <FaCreditCard />, title: "Get Paid Securely", desc: "Stripe holds funds in escrow until delivery is confirmed." },
];

const BUYER_STEPS = [
  { n: 1, icon: <FaSearch />,       title: "Browse Listings",  desc: "Filter by type, price, and category to find the right content." },
  { n: 2, icon: <FaHandshake />,    title: "Make an Offer",    desc: "Send a custom offer or order directly at the listed price." },
  { n: 3, icon: <FaComments />,     title: "Chat with Seller", desc: "Firebase-powered chat linked to your order for smooth delivery." },
  { n: 4, icon: <FaShieldAlt />,    title: "Confirm & Review", desc: "Payment releases from escrow only after you confirm delivery." },
];

const FEATURES = [
  { icon: <FaShieldAlt />, title: "Escrow Protection",    desc: "Stripe holds payment until delivery is confirmed. Funds never released prematurely." },
  { icon: <FaComments />,  title: "Real-time Chat",       desc: "Firebase-powered messaging linked to every order for fast, reliable communication." },
  { icon: <FaHandshake />, title: "Offer Negotiation",    desc: "Buyers and sellers can negotiate price before committing to an order." },
  { icon: <FaChartLine />, title: "Seller Analytics",     desc: "Track earnings, orders, and listing performance from one dashboard." },
  { icon: <FaBolt />,      title: "HypeMode Boost",       desc: "Premium listing placement and reduced platform fees for HypeMode subscribers." },
  { icon: <FaCreditCard />, title: "Multi-Gateway Pay",   desc: "Accept payments via Stripe Connect or PayPal, seller's choice." },
];

export default function MarketplacePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE}/marketplace`,
          isPartOf: { "@type": "WebSite", name: "Wecinema", url: `${SITE}/` },
        }}
      />

      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}>

        {/* Hero */}
        <section
          style={{ padding: "72px 24px", textAlign: "center", background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))" }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 20 }}>
            <FaStore size={28} color="#fff" />
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 900, fontFamily: "var(--font-heading)", color: "#fff", lineHeight: 1.2 }}>
            The Independent Film & Script Marketplace
          </h1>
          <p style={{ margin: "0 0 8px", fontSize: 17, color: "rgba(255,255,255,0.9)", maxWidth: 580, marginInline: "auto", lineHeight: 1.6 }}>
            Buy, sell, and license independent films, scripts, and adaptation rights, directly between creators and buyers, protected by Stripe escrow.
          </p>
          <p style={{ margin: "0 0 32px", fontSize: 14, color: "rgba(255,255,255,0.75)" }}>Free to join. 15% platform fee on sales only.</p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 12,
                backgroundColor: "#fff", color: "var(--color-accent-primary)",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                border: "2px solid #fff", transition: "all 0.15s",
              }}
            >
              <FaUserPlus size={14} /> Start Selling Free
            </Link>
            <Link
              href="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 12,
                backgroundColor: "transparent", color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                border: "2px solid rgba(255,255,255,0.5)", transition: "all 0.15s",
              }}
            >
              <FaShoppingCart size={14} /> Browse as Buyer
            </Link>
          </div>
        </section>

        {/* Features */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
              Built for Creators &amp; Buyers
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: "var(--color-text-tertiary)" }}>
              Everything you need for a smooth, secure transaction
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                backgroundColor: "var(--color-bg-elevated)", borderRadius: 18, padding: "22px 20px",
                border: "1px solid var(--color-border-secondary)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
                className="hover:-translate-y-0.5 hover:shadow-md"
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, color: "var(--color-accent-primary)",
                  backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)",
                }}>
                  {f.icon}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works — two columns */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))", gap: 32 }}>
            {/* Sellers */}
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                For Sellers
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {SELLER_STEPS.map(s => (
                  <div key={s.n} style={{
                    display: "flex", gap: 16, padding: "16px 18px",
                    backgroundColor: "var(--color-bg-elevated)", borderRadius: 16,
                    border: "1px solid var(--color-border-secondary)", alignItems: "flex-start",
                  }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 10, background: "var(--color-accent-primary)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, flexShrink: 0,
                    }}>{s.n}</span>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{s.title}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyers */}
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
                For Buyers
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {BUYER_STEPS.map(s => (
                  <div key={s.n} style={{
                    display: "flex", gap: 16, padding: "16px 18px",
                    backgroundColor: "var(--color-bg-elevated)", borderRadius: 16,
                    border: "1px solid var(--color-border-secondary)", alignItems: "flex-start",
                  }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, flexShrink: 0,
                    }}>{s.n}</span>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{s.title}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <section style={{
          padding: "64px 24px", textAlign: "center",
          background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))",
        }}>
          <h2 style={{ margin: "0 0 10px", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, fontFamily: "var(--font-heading)", color: "#fff" }}>
            Ready to buy or sell video content?
          </h2>
          <p style={{ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.85)", maxWidth: 520, marginInline: "auto" }}>
            Create a free account today. No subscription required to browse. Sellers only pay when they make a sale.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", borderRadius: 12,
                backgroundColor: "#fff", color: "var(--color-accent-primary)",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                border: "2px solid #fff",
              }}
            >
              <FaUserPlus size={14} /> Create Free Account
            </Link>
            <Link
              href="/about"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", borderRadius: 12,
                backgroundColor: "transparent", color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                border: "2px solid rgba(255,255,255,0.5)",
              }}
            >
              Learn More
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
