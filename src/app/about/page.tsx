import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  FaCode, FaPaintBrush, FaRocket, FaUsers, FaHandshake,
  FaVideo, FaUpload, FaUserPlus, FaRobot, FaShoppingCart,
  FaStore, FaComments, FaShieldAlt, FaBolt, FaLayerGroup,
  FaBell, FaChartLine, FaSync, FaCog, FaWallet,
  FaHeart, FaStar,
  FaGithub, FaEnvelope,
} from "react-icons/fa";
import Layout from "@/components/layout/Layout";
import { JsonLd } from "@/components/seo/JsonLd";
import { OG, SOCIAL_PROFILES, SITE_ORIGIN } from "@/lib/seo";

interface WebsiteFeature { icon: React.ReactNode; title: string; description: string; details: string[] }
interface Feature { icon: React.ReactNode; title: string; description: string; category: string }
interface Stat { number: string; label: string; icon: React.ReactNode }
interface Principle { icon: React.ReactNode; title: string; description: string }

const FEATURES: WebsiteFeature[] = [
  { icon: <FaUpload />, title: "Video Upload & Management", description: "Upload MP4, MOV, and WebM files up to 4K resolution directly to cloud storage", details: ["4K support", "MP4 / MOV / WebM", "Cloud storage (S3)", "Thumbnails", "Per-video privacy"] },
  { icon: <FaUserPlus />, title: "User Registration & Profiles", description: "Email/password sign-up with Google OAuth, buyer and seller roles", details: ["Google OAuth", "Buyer & Seller modes", "Profile customization", "Role-based access", "OTP verification"] },
  { icon: <FaRobot />, title: "AI Chatbot Assistant", description: "AI-powered support bot available 24/7 to answer questions about the platform", details: ["24/7 available", "Context-aware", "Platform knowledge", "Powered by OpenRouter"] },
  { icon: <FaBolt />, title: "HypeMode", description: "Premium feature that gives sellers trending badges, priority placement, and reduced fees", details: ["Trending badges", "Priority listing", "Reduced platform fee", "Subscription-based"] },
  { icon: <FaStore />, title: "Seller Marketplace", description: "Create listings, set prices, manage orders, and track earnings in one dashboard", details: ["Listing management", "Order tracking", "Earnings overview", "Offer negotiation"] },
  { icon: <FaShoppingCart />, title: "Buyer Order System", description: "Browse listings, send offers, place orders, and leave reviews after delivery", details: ["Secure checkout", "Offer system", "Order history", "Ratings & reviews"] },
  { icon: <FaComments />, title: "Real-time Chat", description: "Firebase-powered messaging between buyers and sellers, linked to each order", details: ["Real-time messaging", "Order-linked chats", "Typing indicators", "Read receipts"] },
  { icon: <FaShieldAlt />, title: "Secure Payments", description: "Stripe and PayPal with escrow. Funds are held until the buyer confirms delivery", details: ["Stripe", "PayPal", "Escrow protection", "Webhook verified"] },
];

const EXTRA_FEATURES: Feature[] = [
  { icon: <FaSync />, title: "Order Processing", description: "Automated order workflow from payment to delivery confirmation", category: "Workflow" },
  { icon: <FaCog />, title: "Custom Requirements", description: "Buyers can attach custom requirements when placing orders", category: "Workflow" },
  { icon: <FaWallet />, title: "Multi-Gateway Payments", description: "Stripe and PayPal both supported at checkout", category: "Finance" },
  { icon: <FaHeart />, title: "Bookmarks & Liked Videos", description: "Save videos and scripts to personal collections", category: "User Experience" },
  { icon: <FaBell />, title: "Order Notifications", description: "Email alerts on order updates, payments, and messages", category: "Communication" },
  { icon: <FaChartLine />, title: "Seller Earnings Dashboard", description: "Track revenue, completed orders, and active listings", category: "Analytics" },
];

const STATS: Stat[] = [
  { number: "4K", label: "Video Quality", icon: <FaVideo /> },
  { number: "2", label: "Payment Gateways", icon: <FaWallet /> },
  { number: "Real-time", label: "Order Chat", icon: <FaComments /> },
  { number: "Escrow", label: "Payment Protection", icon: <FaShieldAlt /> },
  { number: "24/7", label: "AI Support", icon: <FaRobot /> },
  { number: "Free", label: "To Join", icon: <FaUsers /> },
];

const PRINCIPLES: Principle[] = [
  { icon: <FaCode />, title: "Technical Excellence", description: "Cutting-edge tech and best practices" },
  { icon: <FaPaintBrush />, title: "Design First", description: "Intuitive and beautiful experiences" },
  { icon: <FaRocket />, title: "Innovation Driven", description: "Constantly exploring new solutions" },
  { icon: <FaUsers />, title: "User Centric", description: "Solving real problems for users" },
];

const WORKFLOW = [
  { title: "Content Creation & Upload", desc: "Sellers upload videos with descriptions, pricing, and requirements.", features: [{ icon: <FaUpload />, t: "Upload" }, { icon: <FaCog />, t: "Configure" }, { icon: <FaLayerGroup />, t: "Manage" }] },
  { title: "Buyer Discovery & Order", desc: "Buyers browse, chat with sellers, and place secure orders.", features: [{ icon: <FaShoppingCart />, t: "Order" }, { icon: <FaComments />, t: "Chat" }, { icon: <FaHandshake />, t: "Negotiate" }] },
  { title: "Order Processing & Delivery", desc: "Sellers deliver, buyers review, payments process via escrow.", features: [{ icon: <FaSync />, t: "Process" }, { icon: <FaVideo />, t: "Deliver" }, { icon: <FaWallet />, t: "Pay" }] },
  { title: "Community & Engagement", desc: "Reviews, ratings, and HypeMode events for engagement.", features: [{ icon: <FaStar />, t: "Rate" }, { icon: <FaBolt />, t: "HypeMode" }, { icon: <FaRobot />, t: "AI Support" }] },
];

const SITE = SITE_ORIGIN;
const TITLE = "About WeCinema";
const DESCRIPTION = "Learn about WeCinema's mission to help independent filmmakers buy, sell, stream, and network.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: ["wecinema about", "video marketplace", "sell videos online", "buy video content", "film creators", "wecinema team", "wecinema features"],
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/about`,
    images: [{ url: OG.about, width: 1200, height: 630, alt: "Wecinema – Movies & Scripts Platform" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.about],
  },
};

export default function AboutPage() {
  const grouped = EXTRA_FEATURES.reduce((acc: Record<string, Feature[]>, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  return (
    <Layout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE}/about`,
          isPartOf: { "@type": "WebSite", name: "Wecinema", url: `${SITE}/` },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Wecinema",
          url: `${SITE}/`,
          logo: `${SITE}/wecinema.webp`,
          sameAs: [...SOCIAL_PROFILES],
          member: [
            { "@type": "Person", name: "Scott", jobTitle: "Founder & Creator" },
            { "@type": "Person", name: "Hamza Manzoor", jobTitle: "Full Stack Developer", sameAs: "https://github.com/HH-pro" },
          ],
        }}
      />

      <div className="min-h-screen bg-bg-tertiary text-text-primary">
        {/* Hero */}
        <section
          className="py-20 px-6 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))" }}
        >
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Welcome to <span className="underline underline-offset-[6px]">WeCinema</span>
          </h1>
          <p className="text-lg font-medium text-white/90 mb-2">Buy &amp; sell video content: directly between creators and buyers</p>
          <p className="text-[15px] text-white/80 max-w-[640px] mx-auto mb-7 leading-relaxed">
            WeCinema is a marketplace for video creators. Sellers list their videos with a price, buyers browse and order securely, and payments are held in escrow until delivery is confirmed.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white bg-white text-sm font-semibold transition-all hover:bg-white/90"
              style={{ color: "var(--color-accent-primary)" }}
            >
              <FaUserPlus size={14} /> Create Account
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/50 bg-transparent text-white text-sm font-semibold transition-all hover:bg-white/10"
            >
              <FaVideo size={14} /> Explore Features
            </a>
          </div>
        </section>

        {/* Stats */}
        <div className="max-w-[1100px] mx-auto px-6 py-15">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center p-5 rounded-xl bg-bg-elevated border border-border-secondary">
                <div className="text-xl text-accent-primary mb-2">{s.icon}</div>
                <div className="text-[22px] font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>{s.number}</div>
                <div className="text-xs text-text-tertiary mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div id="features" className="max-w-[1100px] mx-auto px-6 py-15">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>Platform Features</h2>
            <p className="text-[15px] text-text-tertiary">Comprehensive tools for creators and consumers</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-bg-elevated rounded-2xl p-6 border border-border-secondary transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div
                  className="w-11 h-11 rounded-xl text-accent-primary flex items-center justify-center text-lg mb-3.5"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)" }}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>{f.title}</h3>
                <p className="text-[13px] text-text-tertiary leading-relaxed mb-3">{f.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.details.map((d) => (
                    <span key={d} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-bg-tertiary text-text-secondary border border-border-secondary">{d}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="max-w-[1100px] mx-auto px-6 py-15">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>How It Works</h2>
            <p className="text-[15px] text-text-tertiary">Streamlined from creation to consumption</p>
          </div>
          <div className="flex flex-col gap-5">
            {WORKFLOW.map((w, i) => (
              <div key={w.title} className="flex gap-5 p-6 rounded-2xl bg-bg-elevated border border-border-secondary items-start">
                <span className="w-10 h-10 rounded-xl bg-accent-primary text-white flex items-center justify-center text-base font-bold shrink-0">{i + 1}</span>
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-1.5">{w.title}</h3>
                  <p className="text-[13px] text-text-tertiary leading-relaxed mb-2.5">{w.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {w.features.map((f) => (
                      <span
                        key={f.t}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg text-accent-primary"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 5%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--color-accent-primary) 15%, transparent)",
                        }}
                      >
                        {f.icon} {f.t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Features grouped by category */}
        <div className="max-w-[1100px] mx-auto px-6 py-15">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>Advanced Features</h2>
            <p className="text-[15px] text-text-tertiary">Enhanced capabilities for professionals</p>
          </div>
          {Object.entries(grouped).map(([cat, feats]) => (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-accent-primary mb-3 uppercase tracking-[0.05em]">{cat}</h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 mb-7">
                {feats.map((f) => (
                  <div key={f.title} className="flex gap-3 p-4 rounded-xl bg-bg-elevated border border-border-secondary">
                    <div
                      className="w-9 h-9 rounded-[10px] text-accent-primary flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)" }}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-0.5">{f.title}</h4>
                      <p className="text-xs text-text-tertiary">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="max-w-[1100px] mx-auto px-6 py-15">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>Meet the Team</h2>
            <p className="text-[15px] text-text-tertiary">The people behind WeCinema</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {/* Scott */}
            <div className="relative bg-bg-elevated rounded-[20px] px-6 py-8 border border-border-secondary text-center overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: "linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary))" }}
              />
              <div className="relative inline-block mb-4">
                <Image
                  src="/Scott.webp"
                  alt="Scott"
                  width={120}
                  height={120}
                  className="w-[120px] h-[120px] rounded-full object-cover"
                  style={{ border: "3px solid var(--color-accent-primary)", boxShadow: "0 4px 20px rgba(255,107,0,0.25)" }}
                />
                <span
                  className="absolute bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] bg-accent-primary text-white"
                  style={{ border: "2px solid var(--color-bg-elevated)" }}
                >
                  Founder
                </span>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1" style={{ fontFamily: "var(--font-heading)" }}>Scott</h3>
              <p className="text-[13px] text-accent-primary font-semibold mb-3">Founder &amp; Creator</p>
              <p className="text-[13px] text-text-secondary leading-[1.7] mb-4">The visionary behind WeCinema. Scott conceived and created the platform with a mission to connect video creators directly with buyers, building a marketplace where talent meets opportunity.</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {["Vision", "Strategy", "Product"].map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-medium px-3 py-1 rounded-full text-accent-primary"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--color-accent-primary) 15%, transparent)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Hamza */}
            <div className="relative bg-bg-elevated rounded-[20px] px-6 py-8 border border-border-secondary text-center overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
              <div className="relative inline-block mb-4">
                <Image
                  src="/profile.webp"
                  alt="Hamza Manzoor"
                  width={120}
                  height={120}
                  className="w-[120px] h-[120px] rounded-full object-cover"
                  style={{ border: "3px solid #6366f1", boxShadow: "0 4px 20px rgba(99,102,241,0.25)" }}
                />
                <span
                  className="absolute bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] text-white"
                  style={{ backgroundColor: "#6366f1", border: "2px solid var(--color-bg-elevated)" }}
                >
                  Dev
                </span>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1" style={{ fontFamily: "var(--font-heading)" }}>Hamza Manzoor</h3>
              <p className="text-[13px] font-semibold mb-3" style={{ color: "#6366f1" }}>Full Stack Developer</p>
              <p className="text-[13px] text-text-secondary leading-[1.7] mb-4">Built WeCinema from the ground up: React 18 + TypeScript frontend, Node.js + Express + MongoDB backend, Firebase real-time chat, Stripe &amp; PayPal payments, and AWS S3 storage.</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {["React", "Node.js", "MongoDB", "AWS S3"].map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-medium px-3 py-1 rounded-full"
                    style={{
                      color: "#6366f1",
                      backgroundColor: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex gap-2.5 flex-wrap justify-center mt-3.5">
                <a
                  href="https://github.com/HH-pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-border-secondary bg-bg-elevated text-text-secondary text-[13px] font-medium transition-all hover:text-text-primary"
                >
                  <FaGithub /> GitHub
                </a>
                <a
                  href="mailto:hamzamanzoor046@gmail.com"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-border-secondary bg-bg-elevated text-text-secondary text-[13px] font-medium transition-all hover:text-text-primary"
                >
                  <FaEnvelope /> Email
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Principles */}
        <div className="max-w-[1100px] mx-auto px-6 py-15">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>Development Philosophy</h2>
            <p className="text-[15px] text-text-tertiary">Principles that guide our development</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="p-6 rounded-2xl bg-bg-elevated border border-border-secondary text-center">
                <div
                  className="w-12 h-12 rounded-[14px] text-accent-primary flex items-center justify-center text-xl mx-auto mb-3"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)" }}
                >
                  {p.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-text-primary mb-1.5">{p.title}</h3>
                <p className="text-[13px] text-text-tertiary leading-[1.5]">{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <section
          className="py-15 px-6 text-center"
          style={{ background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))" }}
        >
          <h2 className="text-2xl font-bold text-white mb-3 max-w-[600px] mx-auto" style={{ fontFamily: "var(--font-heading)" }}>Ready to buy or sell video content?</h2>
          <p className="text-[15px] text-white/85 max-w-[560px] mx-auto mb-7 leading-relaxed">
            Create a free account, set up your seller profile, and start listing your videos, or browse the marketplace and order from creators directly.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white bg-white text-sm font-semibold transition-all hover:bg-white/90"
              style={{ color: "var(--color-accent-primary)" }}
            >
              <FaUserPlus size={14} /> Create Account
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/50 bg-transparent text-white text-sm font-semibold transition-all hover:bg-white/10"
            >
              <FaStore size={14} /> Start Selling
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
