"use client";

import React from "react";
import Link from "next/link";
import MarketplaceLayout from "@/features/marketplace/components/MarketplaceLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

interface Resource {
  title: string;
  desc: string;
  href: string;
}

const SECTIONS: { heading: string; intro: string; items: Resource[] }[] = [
  {
    heading: "Get started selling",
    intro: "Everything you need to publish your first listing and start earning.",
    items: [
      { title: "Seller Guide", desc: "Step-by-step: from your first listing to getting paid through Stripe escrow.", href: "/marketplace/guide" },
      { title: "Create a listing", desc: "List a film for sale, license rights, take commissions, or sell a script.", href: "/marketplace/listings/new" },
      { title: "Browse the marketplace", desc: "See how other creators present and price their work.", href: "/marketplace/browse" },
    ],
  },
  {
    heading: "Grow your audience",
    intro: "Build a following so your listings sell faster.",
    items: [
      { title: "Upload a film", desc: "Stream your films to a global audience and drive demand for your paid work.", href: "/upload/video" },
      { title: "Publish a script", desc: "Share screenplays to attract collaborators, producers, and buyers.", href: "/upload/script" },
      { title: "HypeMode", desc: "Get discovered faster and connect with audiences and industry pros.", href: "/hypemode" },
    ],
  },
  {
    heading: "Learn & get help",
    intro: "Tips, updates, and answers when you need them.",
    items: [
      { title: "WeCinema Blog", desc: "Tutorials, filmmaking tips, and platform updates.", href: "/blog" },
      { title: "Support", desc: "FAQs and direct help from the WeCinema team.", href: "/support" },
      { title: "About WeCinema", desc: "How the platform works and what we stand for.", href: "/about" },
    ],
  },
];

const Resources: React.FC = () => {
  return (
    <MarketplaceLayout>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px clamp(16px, 4vw, 24px) 64px" }}>
        <div style={{ marginBottom: 16 }}>
          <Breadcrumbs items={[{ name: "Marketplace", href: "/marketplace" }, { name: "Seller Resources" }]} />
        </div>

        <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 800, margin: "0 0 12px", fontFamily: "var(--font-poppins)" }}>
          Seller Resources
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--color-text-secondary)", margin: "0 0 8px", maxWidth: 720 }}>
          A curated hub for WeCinema creators: guides, tools, and tips to help you list, market, and sell
          your films and scripts to a worldwide audience.
        </p>

        {SECTIONS.map((section) => (
          <section key={section.heading} style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", fontFamily: "var(--font-poppins)" }}>
              {section.heading}
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-tertiary)", margin: "0 0 16px" }}>{section.intro}</p>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "block",
                    padding: 18,
                    borderRadius: 14,
                    border: "1px solid var(--color-divider)",
                    textDecoration: "none",
                    background: "var(--color-bg-elevated)",
                  }}
                  className="hover:!border-[var(--color-accent-primary)]"
                >
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: "var(--color-text-primary)" }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--color-text-secondary)", margin: 0 }}>
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </MarketplaceLayout>
  );
};

export default Resources;
