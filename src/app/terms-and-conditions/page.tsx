import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const SITE = SITE_ORIGIN;
const EFFECTIVE_DATE = "June 17, 2026";

const TERMS_DESCRIPTION =
  "Review the terms, policies, and creator guidelines for using WeCinema.";

export const metadata: Metadata = {
  title: { absolute: "Terms & Conditions | WeCinema" },
  description: TERMS_DESCRIPTION,
  keywords: ["WeCinema terms", "video marketplace policy", "content licensing", "indie film platform", "online video terms"],
  alternates: { canonical: "/terms-and-conditions" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: "Terms & Conditions | WeCinema",
    description: TERMS_DESCRIPTION,
    url: `${SITE}/terms-and-conditions`,
    images: [{ url: OG.default, width: 1200, height: 630, alt: "WeCinema Terms & Conditions" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms & Conditions | WeCinema",
    description: TERMS_DESCRIPTION,
    images: [OG.default],
  },
};

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="mt-8">
    <h2
      className="text-[18px] font-semibold text-text-primary mb-4 pb-3 border-b"
      style={{ fontFamily: "var(--font-heading)", borderColor: "var(--color-divider)" }}
    >
      {title}
    </h2>
    {children}
  </section>
);

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-[14.5px] font-semibold text-text-primary mt-5 mb-2">{children}</h4>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[14px] text-text-secondary leading-[1.85] mb-2">{children}</p>
);

const Ul: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="pl-5 mb-3 list-disc space-y-1">{children}</ul>
);

const Li: React.FC<{ children: React.ReactNode; danger?: boolean }> = ({ children, danger }) => (
  <li className="text-[13.5px] leading-[1.8] pl-1" style={{ color: danger ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
    {children}
  </li>
);

const InfoBox: React.FC<{ children: React.ReactNode; variant?: "info" | "warning" | "danger" | "success" }> = ({ children, variant = "info" }) => {
  const map = {
    info:    ["var(--color-info)",    "var(--color-info-bg)"],
    warning: ["var(--color-warning)", "var(--color-warning-bg)"],
    danger:  ["var(--color-danger)",  "var(--color-danger-bg)"],
    success: ["var(--color-success)", "var(--color-success-bg)"],
  } as const;
  const [color, bg] = map[variant];
  return (
    <div className="px-5 py-4 rounded-xl text-[13.5px] leading-[1.75] my-4" style={{ backgroundColor: bg, borderLeft: `4px solid ${color}` }}>
      {children}
    </div>
  );
};

const TOC = [
  { id: "agreement",      label: "1. Agreement to Terms" },
  { id: "accounts",       label: "2. Account Registration & User Types" },
  { id: "aup",            label: "3. Acceptable Use Policy" },
  { id: "content",        label: "4. Content Upload & Licensing" },
  { id: "subscriptions",  label: "5. Subscriptions & Hypemode" },
  { id: "marketplace",    label: "6. Marketplace Transactions" },
  { id: "payments",       label: "7. Payments, Fees & Escrow" },
  { id: "chat",           label: "8. Communication & Chat" },
  { id: "ip",             label: "9. Intellectual Property" },
  { id: "dmca",           label: "10. DMCA & Copyright Takedowns" },
  { id: "termination",    label: "11. Termination & Suspension" },
  { id: "disclaimer",     label: "12. Warranty Disclaimer" },
  { id: "liability",      label: "13. Limitation of Liability" },
  { id: "indemnity",      label: "14. Indemnification" },
  { id: "governing",      label: "15. Governing Law & Disputes" },
  { id: "changes",        label: "16. Changes to Terms" },
];

export default function TermsPage() {
  return (
    <Layout>
      <div className="bg-bg-primary p-6 md:p-10">
        <div
          className="max-w-[900px] mx-auto bg-bg-elevated rounded-[20px] border border-border-secondary overflow-hidden"
          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}
        >
          {/* Accent bar */}
          <div className="h-1" style={{ background: "linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary))" }} />

          {/* Header */}
          <header className="px-8 pt-10 pb-8 border-b border-divider bg-bg-secondary text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h1 className="text-[28px] font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              Terms &amp; Conditions
            </h1>
            <p className="text-[13.5px] text-text-tertiary max-w-lg mx-auto leading-relaxed mb-4">
              This agreement governs your use of WeCinema.co, including video uploading, streaming, marketplace transactions, chat, and payment processing.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {[
                { label: "Effective Date", val: EFFECTIVE_DATE },
                { label: "Version",        val: "3.1" },
                { label: "Jurisdiction",   val: "United States" },
              ].map((item) => (
                <span key={item.label} className="px-3.5 py-1.5 rounded-lg text-[12px] bg-bg-elevated text-text-tertiary border border-border-secondary">
                  <strong className="text-text-primary">{item.label}:</strong> {item.val}
                </span>
              ))}
            </div>
          </header>

          <div className="px-8 py-8 pb-12">
            <InfoBox variant="warning">
              <strong>PLEASE READ CAREFULLY.</strong> By accessing or using WeCinema.co you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree, do not use the platform.
            </InfoBox>

            {/* TOC */}
            <nav className="p-5 rounded-2xl bg-bg-secondary border border-border-secondary mb-2">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Table of Contents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                {TOC.map((t) => (
                  <a key={t.id} href={`#${t.id}`} className="block py-1.5 px-2 text-[13px] text-accent-primary rounded hover:bg-bg-elevated transition-colors">
                    {t.label}
                  </a>
                ))}
              </div>
            </nav>

            {/* ── 1 ── */}
            <Section id="agreement" title="1. Agreement to Terms">
              <P>
                These Terms & Conditions (&quot;Terms&quot;) form a legally binding agreement between you (&quot;User,&quot; &quot;you&quot;) and WeCinema (&quot;Company,&quot; &quot;we,&quot; &quot;us&quot;) governing your access to and use of wecinema.co and all associated services, applications, and content.
              </P>
              <Ul>
                <Li>You must be at least <strong>18 years of age</strong> to use this platform.</Li>
                <Li>If you are using WeCinema on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.</Li>
                <Li>Continued use of the platform after any update to these Terms constitutes acceptance of the revised Terms.</Li>
              </Ul>
            </Section>

            {/* ── 2 ── */}
            <Section id="accounts" title="2. Account Registration & User Types">
              <Sub>2.1 Registration Requirements</Sub>
              <Ul>
                {[
                  "Provide accurate, complete, and up-to-date registration information.",
                  "Maintain the security of your password and accept responsibility for all activity under your account.",
                  "Immediately notify us of any suspected unauthorised use of your account.",
                  "Not create multiple accounts, use another person's account, or use automated means to create accounts.",
                ].map((t) => <Li key={t}>{t}</Li>)}
              </Ul>

              <Sub>2.2 User Roles</Sub>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                {[
                  { title: "Viewer / User",  desc: "Browse and watch content. No payment or upload access without account upgrade." },
                  { title: "Creator",        desc: "Upload and monetise video content. Subject to content and copyright policies." },
                  { title: "Marketplace",    desc: "Buy and sell scripts, licences, and services. Subject to Stripe Connect verification." },
                ].map((r) => (
                  <div key={r.title} className="p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                    <h5 className="text-[13.5px] font-semibold text-accent-primary mb-1.5">{r.title}</h5>
                    <p className="text-[12.5px] text-text-tertiary leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>

              <Sub>2.3 Account Security</Sub>
              <P>Your password is hashed using Argon2id and is never stored in plaintext. We will never ask for your password over email or chat. Sessions use short-lived JWTs (15-minute access tokens) with httpOnly refresh cookies. Protect your login device accordingly.</P>
            </Section>

            {/* ── 3 ── */}
            <Section id="aup" title="3. Acceptable Use Policy">
              <Sub>3.1 Prohibited Content &amp; Services</Sub>
              <P>
                WeCinema does not permit, and you may not upload, post, store, distribute, sell, promote, advertise, or otherwise make available through the platform (including in uploaded video, marketplace listings, profiles, thumbnails, or chat) any of the following prohibited content or services:
              </P>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                {[
                  {
                    title: "Adult content or services",
                    desc: "Pornography, sexually explicit or sexually suggestive material, nudity intended to be sexually gratifying, escort or other adult-entertainment services, and any related goods or services.",
                  },
                  {
                    title: "Copyright-infringing content",
                    desc: "Any material that infringes the copyright, trademark, or other intellectual-property rights of a third party, including pirated, ripped, or unlicensed films, music, scripts, or media.",
                  },
                  {
                    title: "Violent extremism",
                    desc: "Content that promotes, supports, glorifies, funds, or incites terrorism or violent extremism, or that encourages or threatens violence against any individual or group.",
                  },
                ].map((r) => (
                  <div key={r.title} className="p-4 rounded-xl border" style={{ borderColor: "var(--color-danger)", backgroundColor: "var(--color-danger-bg)" }}>
                    <h5 className="text-[13px] font-semibold mb-1.5" style={{ color: "var(--color-danger)" }}>{r.title}</h5>
                    <p className="text-[12.5px] text-text-secondary leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
              <P>
                The categories above are prohibited in addition to the conduct restrictions in Section 3.2. Any content or service falling within these categories may be removed without notice, and the responsible account may be suspended or terminated under Section 11.
              </P>

              <Sub>3.2 Prohibited Conduct</Sub>
              <P>You also agree NOT to use WeCinema to:</P>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {[
                  "Upload, distribute, sell, promote, or advertise adult content or services, including pornography or sexually explicit material.",
                  "Upload, distribute, or sell content that infringes copyright, trademark, or other intellectual property rights.",
                  "Post or transmit content that is illegal, defamatory, obscene, or threatening.",
                  "Upload malware, viruses, ransomware, or any malicious code.",
                  "Harass, bully, stalk, or intimidate other users.",
                  "Attempt to gain unauthorised access to accounts, servers, or the platform's infrastructure.",
                  "Circumvent, disable, or interfere with security features or DRM protections.",
                  "Use automated scripts, bots, or scrapers to collect data or interact with the platform.",
                  "Attempt to bypass payment processing or conduct transactions outside the platform.",
                  "Engage in fraudulent chargebacks, fake reviews, or manipulation of analytics.",
                  "Distribute content involving the sexual exploitation of minors (CSAM), zero tolerance; immediately reported to authorities.",
                  "Promote, support, or glorify terrorism or violent extremism, or incite or threaten violence against individuals or groups.",
                  "Promote hate speech or discrimination against individuals or protected groups.",
                  "Violate any applicable local, national, or international law or regulation.",
                ].map((item) => (
                  <div key={item} className="flex gap-2 p-3 rounded-xl bg-bg-secondary border border-border-secondary">
                    <span className="text-danger mt-0.5 shrink-0">✕</span>
                    <p className="text-[12.5px] text-text-secondary leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <InfoBox variant="danger">
                <strong>Zero-Tolerance Violations:</strong> CSAM, terrorism or violent-extremism content, and platform hacking result in immediate permanent bans and reports to law enforcement, no warnings issued.
              </InfoBox>
            </Section>

            {/* ── 4 ── */}
            <Section id="content" title="4. Content Upload & Licensing">
              <Sub>4.1 Ownership Warranty</Sub>
              <P>By uploading content to WeCinema, you represent and warrant that:</P>
              <Ul>
                {[
                  "You own all rights to the content, or have obtained all necessary licences, permissions, releases, and consents.",
                  "The content does not infringe any copyright, trademark, privacy, or other third-party rights.",
                  "You have the rights to any music, sound effects, fonts, or other third-party elements included in your content.",
                  "The content complies with our Acceptable Use Policy (Section 3).",
                ].map((t) => <Li key={t}>{t}</Li>)}
              </Ul>

              <Sub>4.2 Licence Grant to WeCinema</Sub>
              <P>By uploading content, you grant WeCinema a <strong>non-exclusive, worldwide, royalty-free licence</strong> to host, store, transcode, distribute, and display your content for the purpose of operating the platform. This licence does not transfer ownership. You retain all copyright.</P>
              <P>WeCinema may generate multiple video renditions (1080p, 720p, 360p) via AWS MediaConvert for adaptive streaming, and may store WebP-converted thumbnails for performance optimisation.</P>
              <P>WeCinema may use thumbnails and short clips for promotional purposes (platform homepage, social media, marketing materials). You may opt out by contacting support.</P>

              <Sub>4.3 Content Removal</Sub>
              <P>WeCinema reserves the right to remove any content that violates these Terms, our Acceptable Use Policy, or applicable law, without notice. For DMCA takedown requests, see Section 10.</P>
            </Section>

            {/* ── 5 ── */}
            <Section id="subscriptions" title="5. Subscriptions & Hypemode">
              <Sub>5.1 Subscription Tiers</Sub>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {[
                  { name: "User",      desc: "Free tier. Browse, watch, and basic community features." },
                  { name: "Basic",     desc: "Upload content, basic marketplace access." },
                  { name: "Premium",   desc: "Priority upload processing, enhanced analytics, increased storage." },
                  { name: "Studio",    desc: "Multi-creator management, advanced monetisation, API access." },
                  { name: "Hypemode", desc: "Maximum visibility: homepage featuring, trending badge, priority search, push notifications.", accent: true },
                ].map((tier) => (
                  <div key={tier.name} className="p-4 rounded-xl border"
                    style={{
                      borderColor: tier.accent ? "var(--color-accent-primary)" : "var(--color-border-secondary)",
                      backgroundColor: tier.accent ? "color-mix(in srgb, var(--color-accent-primary) 6%, transparent)" : "var(--color-bg-secondary)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {tier.accent && <span className="text-base">🔥</span>}
                      <h5 className="text-[13.5px] font-semibold" style={{ color: tier.accent ? "var(--color-accent-primary)" : "var(--color-text-primary)" }}>{tier.name}</h5>
                    </div>
                    <p className="text-[12.5px] text-text-tertiary leading-relaxed">{tier.desc}</p>
                  </div>
                ))}
              </div>

              <Sub>5.2 Billing & Cancellation</Sub>
              <Ul>
                <Li>Subscriptions are billed on a recurring basis (monthly or annually as selected).</Li>
                <Li>You may cancel your subscription at any time. Access continues until the end of the paid billing period.</Li>
                <Li>No refunds are issued for partial billing periods, except where required by law.</Li>
                <Li>Price changes will be communicated with at least 30 days' notice before the next billing cycle.</Li>
              </Ul>

              <Sub>5.3 Hypemode Revenue Share</Sub>
              <P>Hypemode participants agree to a <strong>15% platform revenue share</strong> on earnings generated through promoted listings and featured content. This is in addition to standard payment processing fees (Stripe: 2.9% + $0.30 per transaction).</P>
            </Section>

            {/* ── 6 ── */}
            <Section id="marketplace" title="6. Marketplace Transactions">
              <Sub>6.1 Seller Obligations</Sub>
              <Ul>
                {[
                  "Complete Stripe Connect identity verification before receiving payouts.",
                  "Provide accurate listing descriptions, pricing, and realistic delivery timelines.",
                  "Disclose all usage restrictions, licence types, and exclusivity terms in the listing.",
                  "Deliver work through the WeCinema platform, not via external channels.",
                  "Respond to buyer messages within 48 hours of receipt.",
                ].map((t) => <Li key={t}>{t}</Li>)}
              </Ul>

              <Sub>6.2 Buyer Obligations</Sub>
              <Ul>
                {[
                  "Accurately represent intended use when purchasing licences.",
                  "Review and approve (or raise a dispute within the dispute window) upon delivery.",
                  "Not initiate chargebacks without first attempting platform dispute resolution.",
                  "Not redistribute purchased content beyond the licence scope.",
                ].map((t) => <Li key={t}>{t}</Li>)}
              </Ul>

              <Sub>6.3 Order Process</Sub>
              <div className="flex flex-col gap-2.5 mt-3">
                {[
                  "Buyer creates order and payment is authorised (held in Stripe escrow).",
                  "Seller completes and delivers work through the platform chat/delivery system.",
                  "Buyer reviews delivery: approve to release payment or raise a dispute within 48 hours.",
                  "Upon approval, platform fee is deducted and remainder transferred to seller's Stripe account.",
                ].map((step, i) => (
                  <div key={step} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-bg-secondary border border-border-secondary">
                    <span className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: "var(--color-accent-primary)" }}>{i + 1}</span>
                    <p className="text-[13px] text-text-secondary leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              <Sub>6.4 Admin Approval</Sub>
              <P>All marketplace listings are subject to admin review before going live. WeCinema reserves the right to reject any listing that violates these Terms or platform standards, with or without explanation.</P>
            </Section>

            {/* ── 7 ── */}
            <Section id="payments" title="7. Payments, Fees & Escrow">
              <Sub>7.1 Payment Processing</Sub>
              <P>All payments are processed by <strong>Stripe</strong>, a PCI-DSS Level 1 certified payment processor. By making a purchase, you also agree to <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Stripe&apos;s Terms of Service</a>.</P>

              <Sub>7.2 Platform Fees</Sub>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="border-b border-divider">
                      <th className="text-left py-2.5 pr-4 text-text-primary font-semibold">Fee Type</th>
                      <th className="text-left py-2.5 pr-4 text-text-primary font-semibold">Amount</th>
                      <th className="text-left py-2.5 text-text-primary font-semibold">Applies To</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    {[
                      ["Platform Commission", "15%",            "All marketplace transactions"],
                      ["Stripe Processing",   "2.9% + $0.30",   "Per transaction (passed through at cost)"],
                      ["Hypemode Revenue Share", "15% of revenue", "Promoted listing earnings"],
                    ].map(([type, amount, applies]) => (
                      <tr key={type} className="border-b border-divider/50">
                        <td className="py-2.5 pr-4 font-medium text-text-primary">{type}</td>
                        <td className="py-2.5 pr-4 font-semibold text-accent-primary">{amount}</td>
                        <td className="py-2.5">{applies}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Sub>7.3 Escrow & Payment Release</Sub>
              <P>Funds are authorised (not captured) at order creation using Stripe&apos;s manual capture flow. Payment is captured, and transferred to the seller, only upon buyer confirmation of delivery or after the 48-hour dispute window without objection.</P>

              <Sub>7.4 Dispute Resolution</Sub>
              <Ul>
                {[
                  "Either party may raise a dispute within 48 hours of delivery submission.",
                  "WeCinema will review evidence (chat logs, delivery files, communication history) and issue a decision within 5 business days.",
                  "Either party may appeal a decision once, with supporting evidence.",
                  "WeCinema's final decision on fund distribution is binding.",
                  "Fraudulent chargebacks filed outside the platform dispute process may result in account suspension.",
                ].map((t) => <Li key={t}>{t}</Li>)}
              </Ul>

              <Sub>7.5 Payouts</Sub>
              <Ul>
                <Li>Payouts are made to sellers&apos; connected Stripe accounts after the dispute window closes.</Li>
                <Li>Sellers are responsible for all applicable taxes on income received through the platform.</Li>
                <Li>WeCinema may issue 1099 forms to US-based sellers as required by tax law.</Li>
              </Ul>
            </Section>

            {/* ── 8 ── */}
            <Section id="chat" title="8. Communication & Chat">
              <Sub>8.1 Chat Guidelines</Sub>
              <Ul>
                {[
                  "Keep communications professional and directly related to the order or transaction.",
                  "Do not share personal contact details (phone, external email, social media) until an order is completed.",
                  "Use the platform chat for all order-related communications. This creates an evidence trail for dispute resolution.",
                  "All chat messages are stored in Firebase Firestore and may be reviewed by WeCinema in dispute proceedings.",
                ].map((t) => <Li key={t}>{t}</Li>)}
              </Ul>

              <Sub>8.2 Prohibited Communications</Sub>
              <Ul>
                {[
                  "Harassment, threatening, or abusive language toward any user.",
                  "Soliciting payments or transactions outside the WeCinema platform.",
                  "Spamming, unsolicited promotions, or bulk messaging.",
                  "Sharing copyrighted material, malicious links, or executable files.",
                  "Coordinating fraudulent reviews, fake orders, or platform manipulation.",
                ].map((t) => <Li key={t} danger>{t}</Li>)}
              </Ul>
            </Section>

            {/* ── 9 ── */}
            <Section id="ip" title="9. Intellectual Property Rights">
              <Sub>9.1 WeCinema IP</Sub>
              <P>The WeCinema platform, including its design, code, branding, trademarks, and compiled content (excluding user-uploaded content), is the exclusive intellectual property of WeCinema. You may not copy, reproduce, distribute, or create derivative works without express written permission.</P>

              <Sub>9.2 User Content Ownership</Sub>
              <P>You retain full ownership of all content you upload. The licence grant in Section 4.2 does not transfer ownership. You may remove your content at any time, subject to active order obligations.</P>

              <Sub>9.3 Marketplace Licence Types</Sub>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                {[
                  { title: "Standard Licence",   desc: "Personal and non-commercial use only. Cannot be resold or sublicensed." },
                  { title: "Commercial Licence", desc: "Business and monetisation use permitted. Cannot be exclusively assigned." },
                  { title: "Exclusive Licence",  desc: "All usage rights transferred to buyer. Seller may no longer use or resell the work." },
                  { title: "Adaptation Rights",  desc: "Right to create derivative works (sequels, remakes, adaptations) based on the original." },
                  { title: "Licensing Deal",     desc: "Custom terms negotiated between buyer and seller with platform oversight." },
                  { title: "Commission Work",    desc: "Work created specifically for the buyer: buyer owns result subject to agreed terms." },
                ].map((r) => (
                  <div key={r.title} className="p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                    <h5 className="text-[13px] font-semibold text-accent-primary mb-1.5">{r.title}</h5>
                    <p className="text-[12.5px] text-text-tertiary leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── 10 ── */}
            <Section id="dmca" title="10. DMCA & Copyright Takedowns">
              <P>WeCinema respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe content on our platform infringes your copyright, you may submit a takedown notice.</P>

              <Sub>10.1 DMCA Takedown Notice Requirements</Sub>
              <P>Your notice must include:</P>
              <Ul>
                {[
                  "Your full legal name, address, telephone number, and email address.",
                  "Identification of the copyrighted work you claim has been infringed.",
                  "Identification of the infringing material. Include the URL on wecinema.co.",
                  "A statement that you have a good faith belief that the use is not authorised by the copyright owner, its agent, or the law.",
                  "A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorised to act on their behalf.",
                  "Your electronic or physical signature.",
                ].map((t) => <Li key={t}>{t}</Li>)}
              </Ul>
              <P>Send DMCA notices to: <strong>legal@wecinema.co</strong>, subject line: &quot;DMCA Takedown Notice.&quot;</P>

              <Sub>10.2 Counter-Notice</Sub>
              <P>If you believe your content was wrongly removed, you may submit a counter-notice to legal@wecinema.co. We will forward it to the original complainant. If no legal action is filed within 10–14 business days, we may restore the content.</P>

              <Sub>10.3 Repeat Infringers</Sub>
              <P>WeCinema will terminate accounts of users who are found to be repeat copyright infringers, in accordance with our obligations under the DMCA.</P>

              <InfoBox variant="warning">
                <strong>Misuse Warning:</strong> Submitting a false DMCA notice is a violation of these Terms and may expose you to legal liability under 17 U.S.C. § 512(f).
              </InfoBox>
            </Section>

            {/* ── 11 ── */}
            <Section id="termination" title="11. Termination & Suspension">
              <Sub>11.1 Termination by You</Sub>
              <Ul>
                {[
                  "You may delete your account at any time from account settings.",
                  "Active marketplace orders must be completed or mutually cancelled before account deletion.",
                  "Pending payouts will be processed within 30 days of deletion.",
                  "Uploaded content remains for up to 90 days post-deletion, then is permanently removed.",
                ].map((t) => <Li key={t}>{t}</Li>)}
              </Ul>

              <Sub>11.2 Termination or Suspension by WeCinema</Sub>
              <P>We may immediately suspend or permanently terminate your account for:</P>
              <Ul>
                {[
                  "Violation of these Terms or our Acceptable Use Policy.",
                  "Posting, selling, or promoting prohibited content or services (Section 3.1), including adult content, copyright-infringing content, or violent extremism.",
                  "Fraudulent activity, including fake orders or chargebacks.",
                  "Copyright infringement (especially repeat offences).",
                  "Providing false information during registration or Stripe verification.",
                  "Abusive behaviour toward other users or platform staff.",
                  "Any activity that exposes WeCinema or other users to legal liability.",
                ].map((t) => <Li key={t} danger>{t}</Li>)}
              </Ul>
              <P>WeCinema will provide notice where feasible, but reserves the right to act immediately for severe violations. Disputed suspensions may be appealed by emailing support@wecinema.co within 14 days.</P>
            </Section>

            {/* ── 12 ── */}
            <Section id="disclaimer" title="12. Warranty Disclaimer">
              <InfoBox variant="warning">
                <strong>AS-IS BASIS:</strong> WeCinema is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied.
              </InfoBox>
              <P>To the maximum extent permitted by applicable law, WeCinema expressly disclaims all warranties, including but not limited to:</P>
              <Ul>
                <Li>Implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</Li>
                <Li>Warranties that the platform will be uninterrupted, error-free, or free from viruses or malicious code.</Li>
                <Li>Warranties regarding the accuracy, completeness, or reliability of any content on the platform.</Li>
                <Li>Warranties that defects will be corrected or that the platform will meet your specific requirements.</Li>
              </Ul>
              <P>WeCinema does not warrant or endorse the quality, accuracy, safety, or legality of any user-generated content, marketplace listings, or seller deliverables.</P>
            </Section>

            {/* ── 13 ── */}
            <Section id="liability" title="13. Limitation of Liability">
              <P>To the maximum extent permitted by law, WeCinema and its officers, directors, employees, and agents shall not be liable for:</P>
              <Ul>
                <Li>Any indirect, incidental, special, consequential, or punitive damages.</Li>
                <Li>Loss of profits, revenue, data, goodwill, or business opportunities.</Li>
                <Li>Damages resulting from unauthorised access to or alteration of your data.</Li>
                <Li>Conduct of third parties, including other users, Stripe, AWS, or Firebase.</Li>
              </Ul>
              <P>
                In jurisdictions that do not allow limitation of liability for consequential damages, WeCinema&apos;s total liability is limited to the greater of: (a) the total fees you paid to WeCinema in the 6 months preceding the claim, or (b) <strong>USD $500</strong>.
              </P>
              <P>Nothing in these Terms excludes liability for death or personal injury caused by negligence, fraud, or any other matter that cannot be excluded by law.</P>
            </Section>

            {/* ── 14 ── */}
            <Section id="indemnity" title="14. Indemnification">
              <P>You agree to defend, indemnify, and hold harmless WeCinema and its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising from:</P>
              <Ul>
                <Li>Your use or misuse of the platform.</Li>
                <Li>Your violation of these Terms or any applicable law.</Li>
                <Li>Content you upload, post, or transmit through the platform.</Li>
                <Li>Your infringement of any third-party intellectual property or privacy rights.</Li>
                <Li>Any transaction or dispute arising from your marketplace activity.</Li>
              </Ul>
            </Section>

            {/* ── 15 ── */}
            <Section id="governing" title="15. Governing Law & Dispute Resolution">
              <Sub>15.1 Governing Law</Sub>
              <P>These Terms shall be governed by and construed in accordance with the laws of the <strong>State of Delaware, United States</strong>, without regard to its conflict-of-law provisions. For users in the European Union or United Kingdom, mandatory consumer protection laws of your country of residence also apply.</P>

              <Sub>15.2 Informal Resolution</Sub>
              <P>Before initiating formal proceedings, you agree to first attempt to resolve any dispute informally by contacting legal@wecinema.co and giving us 30 days to respond.</P>

              <Sub>15.3 Binding Arbitration</Sub>
              <P>If informal resolution fails, disputes shall be resolved by binding arbitration under the rules of the American Arbitration Association (AAA), not in court, and not as a class action. This does not apply to injunctive relief claims or claims within small-claims court jurisdiction.</P>

              <Sub>15.4 Class Action Waiver</Sub>
              <P>You waive any right to bring or participate in any class-action lawsuit or class-wide arbitration against WeCinema. All disputes must be resolved on an individual basis.</P>
            </Section>

            {/* ── 16 ── */}
            <Section id="changes" title="16. Changes to These Terms">
              <Ul>
                {[
                  "We will post updated Terms with a revised effective date.",
                  "For material changes, we will email registered users at least 30 days before the changes take effect.",
                  "Continued use after the effective date constitutes acceptance of the updated Terms.",
                  "Previous versions are archived and available upon request to legal@wecinema.co.",
                  "If you do not agree with updated Terms, you must stop using the platform and may delete your account.",
                ].map((t) => <Li key={t}>{t}</Li>)}
              </Ul>
            </Section>

            {/* Acceptance block */}
            <div className="mt-10 p-6 rounded-2xl bg-bg-secondary border border-border-secondary text-center">
              <h3 className="text-[15px] font-semibold text-text-primary mb-2">Acceptance of Terms</h3>
              <P>By creating an account or using WeCinema.co, you confirm that you have read, understood, and agree to be bound by these Terms & Conditions and our Privacy Policy.</P>
              <p className="text-[12px] text-text-tertiary mt-3">
                Effective {EFFECTIVE_DATE} · Version 3.1 · WeCinema Video Platform
              </p>
            </div>

            {/* Contact strip */}
            <div className="mt-6 p-5 rounded-2xl text-center" style={{ background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-hover))" }}>
              <h4 className="text-[15px] font-semibold text-white mb-1.5">Questions about these Terms?</h4>
              <p className="text-[13px] text-white/85 leading-relaxed">
                Legal: <strong>legal@wecinema.co</strong> &nbsp;·&nbsp; Support: <strong>support@wecinema.co</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}