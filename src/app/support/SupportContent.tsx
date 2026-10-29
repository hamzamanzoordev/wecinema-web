"use client";

import { useState } from "react";
import {
  FaWhatsapp,
  FaEnvelope,
  FaQuestionCircle,
  FaChevronDown,
  FaHeadset,
  FaClock,
  FaShieldAlt,
} from "react-icons/fa";
import { FAQS } from "./data";

const SUPPORT_CHANNELS = [
  {
    icon: <FaEnvelope size={20} />,
    title: "Email Support",
    desc: "Get a response within 24 hours",
    action: "support@wecinema.co",
    href: "mailto:support@wecinema.co",
    iconBg: "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)",
    iconColor: "var(--color-accent-primary)",
  },
  {
    icon: <FaWhatsapp size={20} />,
    title: "WhatsApp",
    desc: "Quick help via chat",
    action: "Message us",
    href: "https://wa.me/1234567890?text=Hello!%20I%20need%20help.",
    iconBg: "rgba(37,211,102,0.1)",
    iconColor: "#25D366",
  },
] as const;

const FAQItem: React.FC<{ q: string; a: string; open: boolean; onToggle: () => void }> = ({ q, a, open, onToggle }) => (
  <div className={`border-b border-divider transition-colors ${open ? "bg-bg-secondary" : ""}`}>
    <button
      className="w-full flex items-center justify-between gap-3 px-7 py-4 bg-transparent border-0 cursor-pointer text-left text-[15px] font-medium text-text-primary transition-colors"
      onClick={onToggle}
      aria-expanded={open}
    >
      <span>{q}</span>
      <FaChevronDown
        size={12}
        className={`shrink-0 text-accent-primary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </button>
    {open && <p className="px-7 pb-4 text-sm text-text-secondary leading-[1.7]">{a}</p>}
  </div>
);

export default function SupportContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-bg-tertiary px-4 py-10 pb-15">
      <div className="max-w-[720px] mx-auto">
        {/* Hero */}
        <div
          className="bg-bg-elevated rounded-[20px] border border-border-secondary px-8 py-10 text-center mb-6"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4 text-white"
            style={{
              background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))",
              boxShadow: "0 4px 16px rgba(255,107,0,0.25)",
            }}
          >
            <FaHeadset size={28} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>How can we help?</h1>
          <p className="text-[15px] text-text-tertiary leading-relaxed max-w-[480px] mx-auto">
            Browse FAQs below or reach out directly. We&apos;re here to help you get the most out of WeCinema.
          </p>
        </div>

        {/* Support channels */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mb-8">
          {SUPPORT_CHANNELS.map((ch) => (
            <a
              key={ch.title}
              href={ch.href}
              target={ch.href.startsWith("http") ? "_blank" : undefined}
              rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-4 p-5 bg-bg-elevated rounded-xl border border-border-secondary transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: ch.iconBg, color: ch.iconColor }}
              >
                {ch.icon}
              </div>
              <div>
                <div className="text-[15px] font-semibold text-text-primary mb-0.5">{ch.title}</div>
                <div className="text-xs text-text-tertiary mb-1">{ch.desc}</div>
                <div className="text-[13px] font-medium text-accent-primary">{ch.action}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Info cards */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <div className="flex-[1_1_200px] flex items-center gap-3 p-4 rounded-[14px] bg-bg-secondary border border-border-secondary">
            <FaClock className="text-accent-primary shrink-0 text-base" />
            <div>
              <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.05em]">Support Hours</div>
              <div className="text-sm font-semibold text-text-primary mt-0.5">Mon–Fri, 9 AM – 6 PM</div>
            </div>
          </div>
          <div className="flex-[1_1_200px] flex items-center gap-3 p-4 rounded-[14px] bg-bg-secondary border border-border-secondary">
            <FaShieldAlt className="text-accent-primary shrink-0 text-base" />
            <div>
              <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.05em]">Response Time</div>
              <div className="text-sm font-semibold text-text-primary mt-0.5">Within 24 hours</div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div
          className="bg-bg-elevated rounded-[20px] border border-border-secondary overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <div className="px-7 pt-6 pb-4 border-b border-divider">
            <div className="flex items-center gap-2">
              <FaQuestionCircle size={16} className="text-accent-primary" />
              <h2 className="text-lg font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>Frequently Asked Questions</h2>
            </div>
            <p className="text-[13px] text-text-tertiary mt-1">Quick answers to common questions</p>
          </div>
          {FAQS.map((faq, i) => (
            <FAQItem
              key={faq.q}
              q={faq.q}
              a={faq.a}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
