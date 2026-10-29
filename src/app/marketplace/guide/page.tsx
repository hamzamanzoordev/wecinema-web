"use client";

import React from "react";
import Link from "next/link";
import MarketplaceLayout from "@/features/marketplace/components/MarketplaceLayout";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const PAGE_URL = `${SITE_ORIGIN}/marketplace/guide`;
const PUBLISHED = "2026-07-15";

const SELLABLE = [
  {
    title: "Finished films & video content",
    body: "Sell short films, features, or video content outright to buyers who want to own or distribute it.",
  },
  {
    title: "Licensing",
    body: "Grant a commercial, broadcast, or streaming license while keeping ownership of your work.",
  },
  {
    title: "Adaptation rights",
    body: "Sell the rights to remake, adapt, or build a sequel or spin-off from your story or script.",
  },
  {
    title: "Commissions",
    body: "Take paid briefs from buyers who want custom films or video produced to their specification.",
  },
  {
    title: "Scripts & screenplays",
    body: "List finished scripts and screenplays for sale, optioning, or creative collaboration.",
  },
];

const STEPS = [
  {
    title: "Create your seller account",
    body: (
      <>
        Sign up and choose the seller role, then connect a Stripe account so you can get paid. WeCinema
        uses Stripe escrow, which means a buyer&apos;s funds are held securely and only released to you once
        the sale is confirmed, protecting both sides of every deal. <Link href="/signup">Create your
        account</Link> to begin.
      </>
    ),
  },
  {
    title: "Create a listing",
    body: (
      <>
        Head to <Link href="/marketplace/listings/new">New Listing</Link> and add your film or script.
        Choose the listing type that matches your goal (<strong>for sale</strong>,{" "}
        <strong>licensing</strong>, <strong>adaptation rights</strong>, or <strong>commission</strong>),
        then upload a poster or thumbnail, write a clear description, and set your price. A specific title
        (genre, theme, and format) helps your listing surface in both marketplace and Google search.
      </>
    ),
  },
  {
    title: "Get approved & go live",
    body: (
      <>
        Every new listing passes a quick review to keep the marketplace high-quality and trustworthy for
        buyers. Once approved, your listing goes live and becomes discoverable in{" "}
        <Link href="/marketplace/browse">Browse Listings</Link> and across search engines.
      </>
    ),
  },
  {
    title: "Negotiate offers & chat with buyers",
    body: (
      <>
        Buyers can purchase at your listed price or send a custom offer. Use built-in, order-linked chat
        to answer questions, clarify what&apos;s included, agree on terms, and close the deal, all inside
        WeCinema, with a record attached to the order.
      </>
    ),
  },
  {
    title: "Deliver & get paid",
    body: (
      <>
        Once the buyer confirms delivery, Stripe escrow releases your earnings (minus the platform fee)
        straight to your connected account. Track orders, offers, and payouts from your{" "}
        <Link href="/marketplace/dashboard/seller">seller dashboard</Link>.
      </>
    ),
  },
];

const TIPS = [
  "Lead with a strong poster or thumbnail. It's the first thing buyers see in Browse and in search results.",
  "Write a specific, honest description: genre, runtime, format, what rights are included, and what makes the work stand out.",
  "Pick the right listing type. A licensing or adaptation-rights listing reaches a very different buyer than an outright sale.",
  "Respond quickly to offers and messages. Momentum closes deals, and responsiveness builds seller reputation.",
  "Consider HypeMode for priority placement, a trending badge, and reduced fees when you want a listing seen fast.",
];

const FAQ = [
  {
    q: "How do I sell my short film online?",
    a: "Create a free WeCinema seller account, connect Stripe, then list your short film with a poster, description, and price. Choose whether you're selling it outright, licensing it, or offering adaptation rights. Once approved, your listing is discoverable to buyers and payment is handled securely through escrow.",
  },
  {
    q: "How much does it cost to sell on WeCinema?",
    a: "Creating an account and listing your work is completely free. WeCinema charges a platform fee only when you make a sale; the remainder is transferred to your connected Stripe account. There is no upfront or listing cost, so you can test pricing risk-free.",
  },
  {
    q: "How should I price my film or script?",
    a: "There's no single right price. Finished short films typically sell or license for modest flat fees, while feature rights and adaptation deals command more. Many creators offer tiered options: a lower price for a limited or non-exclusive license and a higher price for exclusive or outright sale. Browse comparable listings, be clear about exactly what the buyer receives, and start with a fair price you can adjust.",
  },
  {
    q: "Can I sell film or adaptation rights without selling the film itself?",
    a: "Yes. Licensing lets you grant commercial, broadcast, or streaming usage while keeping ownership, and an adaptation-rights listing sells the right to remake or adapt your story. You choose the model that fits: outright sale, license, adaptation rights, or a custom commission.",
  },
  {
    q: "How do I get paid, and is it safe?",
    a: "Payments run through Stripe escrow. A buyer's funds are authorized at purchase and held until the order is marked delivered, then released to your Stripe account. Because money is only released after delivery is confirmed, both buyer and seller are protected from fraud.",
  },
  {
    q: "How long does listing approval take?",
    a: "Most listings are reviewed quickly. You'll be notified the moment your listing is approved and goes live in the marketplace.",
  },
];

const h2Style = {
  fontSize: 22,
  fontWeight: 800,
  margin: "0 0 14px",
  fontFamily: "var(--font-poppins)",
} as const;

const para = {
  fontSize: 15.5,
  lineHeight: 1.7,
  color: "var(--color-text-secondary)",
  margin: "0 0 14px",
} as const;

const Guide: React.FC = () => {
  return (
    <MarketplaceLayout>
      {/* Article schema — replaces deprecated HowTo (Google retired HowTo rich
          results in Sept 2023). Establishes the guide as an authored WeCinema
          resource for entity + AI-citation signals. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "How to Sell Your Film or Script Online",
          description:
            "A step-by-step guide to selling independent films, licensing rights, adaptation rights, and scripts online through the WeCinema marketplace: pricing, escrow payments, and getting discovered.",
          image: OG.marketplace,
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
          author: { "@type": "Organization", name: "WeCinema", url: SITE_ORIGIN },
          publisher: {
            "@type": "Organization",
            name: "WeCinema",
            url: SITE_ORIGIN,
            logo: { "@type": "ImageObject", url: OG.default },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px clamp(16px, 4vw, 24px) 64px" }}>
        <div style={{ marginBottom: 16 }}>
          <Breadcrumbs items={[{ name: "Marketplace", href: "/marketplace" }, { name: "Seller Guide" }]} />
        </div>

        <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 800, margin: "0 0 14px", fontFamily: "var(--font-poppins)" }}>
          How to Sell Your Film or Script Online
        </h1>
        {/* Featured-snippet / AI-citation lead: a self-contained 40–55 word direct
            answer immediately under the H1, before the narrative intro. */}
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.65,
            fontWeight: 500,
            color: "var(--color-text-primary)",
            margin: "0 0 18px",
            maxWidth: 720,
            paddingLeft: 16,
            borderLeft: "3px solid var(--color-accent-primary)",
          }}
        >
          To sell your film or script online, create a free WeCinema seller account, connect Stripe, and
          list your work, choosing an outright sale, a license, adaptation rights, or a commission. Set
          your price, get approved, and Stripe escrow holds the buyer&apos;s payment until you deliver, then
          releases your earnings.
        </p>
        <p style={{ ...para, fontSize: 16.5, maxWidth: 720 }}>
          Selling your film or script online has never been more accessible. Whether you&apos;ve finished a
          short film, hold the rights to a feature, or have a screenplay ready for the right producer, you
          no longer need a festival slot or an agent to reach buyers. This guide explains exactly how to
          sell your film or script online through the <Link href="/marketplace">WeCinema marketplace</Link>
          : what you can list, how to price your work, how escrow protects both sides, and how to get
          discovered by the studios, production companies, and creators actively looking for content like
          yours.
        </p>

        <section aria-label="What you can sell" style={{ marginTop: 36 }}>
          <h2 style={h2Style}>What you can sell online on WeCinema</h2>
          <p style={para}>
            WeCinema isn&apos;t just a place to sell a finished movie. It supports four commercial models plus
            scripts, so you can monetize your work in whatever way fits your goals as an independent creator:
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {SELLABLE.map((s) => (
              <div key={s.title} style={{ display: "flex", gap: 12 }}>
                <span aria-hidden style={{ flexShrink: 0, marginTop: 8, width: 7, height: 7, borderRadius: 9999, background: "var(--color-accent-primary)" }} />
                <p style={{ ...para, margin: 0 }}>
                  <strong style={{ color: "var(--color-text-primary)" }}>{s.title}.</strong> {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Steps to sell" style={{ marginTop: 44 }}>
          <h2 style={h2Style}>How to sell your film or script: step by step</h2>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 22 }}>
            {STEPS.map((s, i) => (
              <div key={s.title} id={`step-${i + 1}`} style={{ display: "flex", gap: 16 }}>
                <div
                  aria-hidden
                  style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: 9999,
                    background: "var(--color-accent-primary)", color: "#000",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 6px" }}>{s.title}</h3>
                  <p style={{ ...para, margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Pricing" style={{ marginTop: 44 }}>
          <h2 style={h2Style}>How to price your film or script</h2>
          <p style={para}>
            There&apos;s no single &quot;right&quot; price, but a few principles help you set one with confidence.
            Finished short films typically sell or license for modest flat fees, while feature rights and
            adaptation deals command more. Many creators list <strong>tiered options</strong>: a lower price
            for a limited or non-exclusive license, and a higher price for exclusive or outright sale.
          </p>
          <p style={para}>
            Before you publish, research comparable work in <Link href="/marketplace/browse">Browse
            Listings</Link>, and be transparent about exactly what the buyer receives: exclusive vs
            non-exclusive rights, territory, and duration. Because WeCinema is free to list and charges a
            platform fee only on completed sales, there&apos;s no risk in starting with a fair price and
            adjusting as you learn what buyers respond to.
          </p>
        </section>

        <section aria-label="Getting paid" style={{ marginTop: 44 }}>
          <h2 style={h2Style}>How you get paid: escrow, explained</h2>
          <p style={para}>
            Every transaction is protected by <strong>Stripe escrow</strong>. When a buyer purchases or
            accepts an offer, their payment is authorized and held, not sent directly to you, and not left
            with the buyer. Funds are only released to your connected Stripe account once the order is marked
            delivered and confirmed. This protects sellers from non-payment and buyers from non-delivery, so
            both sides can transact with strangers safely. Your earnings, minus the platform fee, land in
            your Stripe account automatically.
          </p>
        </section>

        <section aria-label="Tips" style={{ marginTop: 44 }}>
          <h2 style={h2Style}>Tips to sell faster and get discovered</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {TIPS.map((t) => (
              <li key={t} style={{ ...para, margin: 0 }}>{t}</li>
            ))}
          </ul>
        </section>

        <section aria-label="Frequently asked questions" style={{ marginTop: 48 }}>
          <h2 style={h2Style}>Frequently asked questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQ.map((f) => (
              <div key={f.q} style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: 14 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{f.q}</h3>
                <p style={{ ...para, margin: 0, fontSize: 15 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href="/marketplace/listings/new"
            style={{ padding: "12px 22px", borderRadius: 12, background: "var(--color-accent-primary)", color: "#000", fontWeight: 700, textDecoration: "none" }}
          >
            List your film
          </Link>
          <Link
            href="/marketplace/resources"
            style={{ padding: "12px 22px", borderRadius: 12, border: "1px solid var(--color-divider)", color: "var(--color-text-secondary)", fontWeight: 600, textDecoration: "none" }}
          >
            Seller resources
          </Link>
          <Link
            href="/support"
            style={{ padding: "12px 22px", borderRadius: 12, border: "1px solid var(--color-divider)", color: "var(--color-text-secondary)", fontWeight: 600, textDecoration: "none" }}
          >
            Get support
          </Link>
        </section>
      </div>
    </MarketplaceLayout>
  );
};

export default Guide;
