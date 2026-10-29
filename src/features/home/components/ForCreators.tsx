import Link from "next/link";
import {
  Wallet,
  ShieldCheck,
  Repeat,
  Clapperboard,
  ShoppingBag,
  Globe,
  Handshake,
  Play,
  Upload,
  DollarSign,
  Film,
  FileText,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * Merged "For Creators" section — one cohesive block that replaces the three
 * scattered marketing sections (WhyWeCinema + HowItWorks + CreatorBanner).
 * Minimal/editorial: one header, calm uniform cards, restrained accent.
 */

const STEPS = [
  { icon: <Play size={20} />, title: "Watch", desc: "Explore independent films from creators worldwide." },
  { icon: <Upload size={20} />, title: "Upload", desc: "Publish your own films and scripts." },
  { icon: <DollarSign size={20} />, title: "Earn", desc: "Make revenue through streaming and marketplace sales." },
] as const;

const PILLARS = [
  {
    icon: <Wallet size={20} />,
    title: "Creator-to-buyer, no middlemen",
    desc: "Set your own price and sell directly to a global audience of buyers. Keep more of every sale.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Escrow on every order",
    desc: "Stripe holds funds until delivery is confirmed. Buyers purchase with zero risk, sellers get paid for confirmed work.",
  },
  {
    icon: <Repeat size={20} />,
    title: "Four ways to monetize",
    desc: "Sell finished films, license rights, sell adaptation rights, or take custom commissions: every model, one platform.",
  },
  {
    icon: <Clapperboard size={20} />,
    title: "Built for filmmakers",
    desc: "4K uploads, adaptive streaming, order-linked chat, and an AI assistant trained for film. Made by people who get the craft.",
  },
] as const;

const MODELS = [
  { icon: <ShoppingBag size={16} />, title: "For Sale", desc: "Direct purchase of finished films." },
  { icon: <Globe size={16} />, title: "Licensing", desc: "Broadcast & digital distribution rights." },
  { icon: <Repeat size={16} />, title: "Adaptation Rights", desc: "Remakes, sequels & derivative works." },
  { icon: <Handshake size={16} />, title: "Commission", desc: "Custom work to a buyer's brief." },
] as const;

const cardBase: React.CSSProperties = {
  backgroundColor: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border-secondary)",
  borderRadius: 16,
};

const ctaBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  borderRadius: 12,
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
};

const accentIcon: React.CSSProperties = {
  display: "inline-flex",
  color: "var(--color-accent-primary)",
};

export function ForCreators() {
  return (
    <Section divider maxWidth="content" ariaLabelledby="for-creators-heading">
      <SectionHeader
        align="center"
        eyebrow="For Creators"
        title="Watch, create, and trade independent film"
        titleId="for-creators-heading"
        subtitle="WeCinema brings streaming and a creator marketplace together. Discover films from creators worldwide, and sell, license, or commission work with escrow-protected payments."
      />

      {/* How it works — three minimal steps */}
      <ol
        style={{
          listStyle: "none",
          margin: "8px 0 56px",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
        }}
      >
        {STEPS.map((s, i) => (
          <li key={s.title} style={{ textAlign: "center", padding: "0 8px" }}>
            <span style={{ ...accentIcon, marginBottom: 12 }}>{s.icon}</span>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-accent-primary)",
              }}
            >
              Step {i + 1}
            </p>
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              {s.title}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
              {s.desc}
            </p>
          </li>
        ))}
      </ol>

      {/* Why WeCinema — four calm pillars */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {PILLARS.map((p) => (
          <div key={p.title} style={{ ...cardBase, padding: "22px 20px" }}>
            <span style={{ ...accentIcon, marginBottom: 14 }}>{p.icon}</span>
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                color: "var(--color-text-primary)",
                lineHeight: 1.3,
              }}
            >
              {p.title}
            </h3>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
              {p.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Marketplace models strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 48,
        }}
      >
        {MODELS.map((m) => (
          <div
            key={m.title}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 12,
              backgroundColor: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border-secondary)",
            }}
          >
            <span style={{ ...accentIcon, marginTop: 1, flexShrink: 0 }}>{m.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--color-text-primary)" }}>
                {m.title}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.45 }}>
                {m.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion CTA — restrained accent panel (replaces the dark banner) */}
      <div
        style={{
          borderRadius: 20,
          padding: "clamp(28px, 5vw, 48px)",
          textAlign: "center",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-ring)",
        }}
      >
        <h3
          style={{
            margin: "0 auto 10px",
            maxWidth: 640,
            fontSize: "clamp(1.4rem, 3.4vw, 2rem)",
            fontWeight: 700,
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
          }}
        >
          Have a film or script? Start earning today.
        </h3>
        <p style={{ margin: "0 auto 20px", maxWidth: 520, fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          Upload original content, build an audience, and monetize your creativity.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/upload/video"
            style={{ ...ctaBtn, background: "var(--color-accent-primary)", color: "var(--color-btn-primary-text,#000)", boxShadow: "0 6px 18px var(--accent-ring)" }}
            className="hover:!brightness-110"
          >
            <Film size={17} /> Upload Film
          </Link>
          <Link
            href="/upload/script"
            style={{ ...ctaBtn, background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-secondary)" }}
            className="hover:!brightness-105"
          >
            <FileText size={17} /> Upload Script
          </Link>
        </div>
      </div>
    </Section>
  );
}
