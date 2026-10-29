import { Plus } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const FAQS = [
  {
    q: "Is WeCinema free to join?",
    a: "Yes. Creating an account, browsing the marketplace, watching free films, and listing your work is completely free. Sellers only pay a platform fee when a sale actually completes.",
  },
  {
    q: "How are payments protected?",
    a: "Every order is protected by Stripe escrow. Funds are authorized when the order is placed and only released to the seller after the buyer confirms delivery, so funds are never released prematurely.",
  },
  {
    q: "What can I sell?",
    a: "Finished films and video content, commercial and broadcast licensing, adaptation rights for remakes and sequels, or custom commissions to a buyer's brief: four marketplace models in one place.",
  },
  {
    q: "What is HypeMode?",
    a: "HypeMode is a premium tier that gives your listings a trending badge, priority placement in discovery, push notifications to buyers, and a reduced platform fee on HypeMode sales.",
  },
  {
    q: "Who is WeCinema for?",
    a: "Independent filmmakers, scriptwriters, actors, studios, and AI creators who want to monetize their work, and the production companies and studios looking to source films, scripts, licensing, or custom video.",
  },
] as const;

export function FaqSection() {
  return (
    <Section maxWidth="prose" divider ariaLabelledby="faq-heading">
      <SectionHeader
        align="center"
        eyebrow="FAQ"
        title="Frequently asked questions"
        titleId="faq-heading"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {FAQS.map((f) => (
            <details
              key={f.q}
              className="group/faq"
              style={{
                borderRadius: 14,
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-secondary)",
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "16px 18px",
                  cursor: "pointer",
                  listStyle: "none",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {f.q}
                <Plus
                  size={18}
                  className="shrink-0 transition-transform duration-200 group-open/faq:rotate-45"
                  style={{ color: "var(--color-accent-primary)" }}
                  aria-hidden
                />
              </summary>
              <p
                style={{
                  margin: 0,
                  padding: "0 18px 16px",
                  fontSize: 14,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {f.a}
              </p>
            </details>
          ))}
      </div>
    </Section>
  );
}
