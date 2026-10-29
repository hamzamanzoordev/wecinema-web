import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { OG } from "@/lib/seo";

const PRIVACY_DESCRIPTION =
  "Read WeCinema's privacy policy and learn how user data and creator content are protected.";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | WeCinema" },
  description: PRIVACY_DESCRIPTION,
  alternates: { canonical: "/privacy-policy" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: "Privacy Policy | WeCinema",
    description: PRIVACY_DESCRIPTION,
    images: [{ url: OG.privacy, width: 1200, height: 630, alt: "WeCinema Privacy Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | WeCinema",
    description: PRIVACY_DESCRIPTION,
    images: [OG.privacy],
  },
};

const EFFECTIVE_DATE = "September 15, 2026";
const NEXT_REVIEW   = "November 17, 2026";

const Section: React.FC<{ id?: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="mt-7 p-6 rounded-2xl border border-border-secondary bg-bg-elevated">
    <h2
      className="text-lg font-semibold text-text-primary mb-4 pb-3 border-b"
      style={{ fontFamily: "var(--font-heading)", borderColor: "var(--color-divider)" }}
    >
      {title}
    </h2>
    {children}
  </section>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[14.5px] text-text-secondary leading-[1.85] my-2">{children}</p>
);

const Ul: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="pl-5 my-3 list-disc space-y-1">{children}</ul>
);

const Li: React.FC<{ children: React.ReactNode; danger?: boolean }> = ({ children, danger }) => (
  <li
    className="text-[14px] leading-[1.8] pl-1"
    style={{ color: danger ? "var(--color-danger)" : "var(--color-text-secondary)" }}
  >
    {children}
  </li>
);

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold"
    style={{
      backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)",
      color: "var(--color-accent-primary)",
    }}
  >
    {children}
  </span>
);

const InfoBox: React.FC<{ children: React.ReactNode; variant?: "info" | "warning" | "success" }> = ({ children, variant = "info" }) => {
  const color =
    variant === "warning" ? "var(--color-warning)"
    : variant === "success" ? "var(--color-success)"
    : "var(--color-info)";
  const bg =
    variant === "warning" ? "var(--color-warning-bg)"
    : variant === "success" ? "var(--color-success-bg)"
    : "var(--color-info-bg)";
  return (
    <div className="px-5 py-4 rounded-xl text-[13.5px] leading-[1.75] my-4" style={{ backgroundColor: bg, borderLeft: `4px solid ${color}` }}>
      {children}
    </div>
  );
};

const TOC = [
  { id: "overview",       label: "1. Overview & Scope" },
  { id: "collect",        label: "2. Information We Collect" },
  { id: "use",            label: "3. How We Use Your Information" },
  { id: "sharing",        label: "4. Information Sharing & Third Parties" },
  { id: "security",       label: "5. Data Security & Technical Safeguards" },
  { id: "retention",      label: "6. Data Retention" },
  { id: "rights",         label: "7. Your Rights & Choices" },
  { id: "cookies",        label: "8. Cookies & Tracking" },
  { id: "transfers",      label: "9. International Data Transfers" },
  { id: "children",       label: "10. Children's Privacy" },
  { id: "gdpr",           label: "11. GDPR Compliance (EEA Users)" },
  { id: "ccpa",           label: "12. CCPA Rights (California Users)" },
  { id: "changes",        label: "13. Changes to This Policy" },
  { id: "contact",        label: "14. Contact & Data Controller" },
];

export default function PrivacyPolicyPage() {
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
          <header className="px-8 pt-10 pb-8 text-center border-b border-divider bg-bg-secondary">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h1 className="text-[28px] font-bold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Privacy Policy
            </h1>
            <p className="text-[13.5px] text-text-tertiary max-w-md mx-auto leading-relaxed mb-4">
              This policy explains how WeCinema collects, uses, stores, and protects your personal information when you use our platform.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {[
                { label: "Effective Date", val: EFFECTIVE_DATE },
                { label: "Version",        val: "3.0" },
                { label: "Next Review",    val: NEXT_REVIEW },
              ].map((item) => (
                <span key={item.label} className="px-3.5 py-1.5 rounded-lg text-[12px] bg-bg-elevated text-text-tertiary border border-border-secondary">
                  <strong className="text-text-primary">{item.label}:</strong> {item.val}
                </span>
              ))}
            </div>
          </header>

          <div className="px-8 py-8">
            <InfoBox variant="warning">
              <strong>IMPORTANT:</strong> By using WeCinema, including browsing, uploading content, buying, selling, or interacting with any feature, you acknowledge that you have read and understood this Privacy Policy.
            </InfoBox>

            {/* Table of Contents */}
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
            <Section id="overview" title="1. Overview & Scope">
              <P>
                WeCinema (&quot;we,&quot; &quot;our,&quot; or &quot;the Platform&quot;) operates <strong>wecinema.co</strong>, an independent film platform for watching, uploading, distributing, and selling video content and scripts. This Privacy Policy applies to all users, including:
              </P>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {[
                  { title: "Viewers / Users",   desc: "Browse and watch content on the platform." },
                  { title: "Content Creators",  desc: "Upload, host, and monetize video content." },
                  { title: "Marketplace Users", desc: "Buy and sell scripts, licenses, and services." },
                ].map((r) => (
                  <div key={r.title} className="p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                    <h4 className="text-[13.5px] font-semibold text-accent-primary mb-1.5">{r.title}</h4>
                    <p className="text-[13px] text-text-tertiary leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
              <P>This policy also covers data collected through our mobile-optimised web app (PWA), email communications, and any integrations you authorise.</P>
            </Section>

            {/* ── 2 ── */}
            <Section id="collect" title="2. Information We Collect">
              <h3 className="text-[14.5px] font-semibold text-text-primary mt-1 mb-3">2.1 Information You Provide Directly</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { t: "Account Details",       d: "Username, email address, password (stored as Argon2 hash, never plaintext), profile picture, bio, and profile tags.",               accent: false },
                  { t: "Payment Information",   d: "Billing details are processed exclusively by Stripe. WeCinema never stores raw card numbers or CVV data.",                          accent: true  },
                  { t: "Content & Metadata",    d: "Video files, thumbnails, scripts, listing titles, descriptions, pricing, tags, and associated usage-rights information.",          accent: false },
                  { t: "Shipping Addresses",    d: "For physical-goods orders, shipping addresses are stored AES-256-CBC encrypted using a platform-managed key.",                     accent: false },
                  { t: "Communications",        d: "Messages sent via our marketplace chat (stored in Firebase Firestore), support requests, and report submissions.",                 accent: false },
                  { t: "Identity Verification", d: "For Stripe Connect seller onboarding, Stripe may collect government ID and bank details directly. We do not see these.",         accent: false },
                ].map((c) => (
                  <div
                    key={c.t}
                    className="p-4 rounded-xl"
                    style={
                      c.accent
                        ? { border: "2px solid var(--color-accent-primary)", backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 6%, transparent)" }
                        : { border: "1px solid var(--color-border-secondary)", backgroundColor: "var(--color-bg-secondary)" }
                    }
                  >
                    <h4 className="text-[13.5px] font-semibold mb-1.5" style={{ color: c.accent ? "var(--color-accent-primary)" : "var(--color-text-primary)" }}>
                      {c.t}
                    </h4>
                    <p className="text-[13px] text-text-tertiary leading-relaxed">{c.d}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-[14.5px] font-semibold text-text-primary mt-6 mb-3">2.2 Information Collected Automatically</h3>
              <Ul>
                {[
                  ["IP Address & Device Info",    "Browser type, operating system, screen resolution, device identifiers."],
                  ["Log Data",                    "Pages visited, features used, timestamps, referring URLs, error logs."],
                  ["Video Playback Telemetry",    "Watch duration, buffering events, quality selection, used to improve streaming."],
                  ["Cookies & Local Storage",     "A secure sign-in cookie, your cookie choices and your preferences. Optional cookies only with your consent. See Section 8."],
                  ["Analytics",                   "Usage and page-speed measurement through Google Analytics, only if you allow analytics cookies."],
                ].map(([label, detail]) => (
                  <Li key={label}>
                    <Badge>{label}</Badge>{" "}{detail}
                  </Li>
                ))}
              </Ul>

              <h3 className="text-[14.5px] font-semibold text-text-primary mt-6 mb-3">2.3 Information from Third Parties</h3>
              <Ul>
                <Li><strong>Google / Firebase Auth:</strong> If you sign in with Google, Firebase verifies your identity and returns your name, email, and profile photo.</Li>
                <Li><strong>Stripe:</strong> Webhook events notify us of payment status, dispute outcomes, and payout completions. No raw card data is shared.</Li>
                <Li><strong>AWS:</strong> S3 access logs and CloudFront distribution logs may include your IP address and request metadata.</Li>
              </Ul>
            </Section>

            {/* ── 3 ── */}
            <Section id="use" title="3. How We Use Your Information">
              {[
                {
                  h: "Platform Operation",
                  items: [
                    "Authenticating your identity and maintaining secure sessions (JWT access tokens, httpOnly refresh cookies)",
                    "Hosting, streaming, and delivering video content via AWS S3 pre-signed URLs",
                    "Transcoding uploaded videos to 1080p / 720p / 360p renditions via AWS MediaConvert",
                    "Processing marketplace transactions and managing escrow via Stripe",
                  ],
                },
                {
                  h: "Communication",
                  items: [
                    "Sending OTP verification codes during registration and login",
                    "Order status notifications (creation, delivery, completion, disputes)",
                    "Subscription expiry warnings and renewal reminders",
                    "Platform announcements and policy updates (opt-out available)",
                  ],
                },
                {
                  h: "Personalisation & Recommendations",
                  items: [
                    "Recommending videos, creators, and marketplace listings based on your activity",
                    "Surfacing content relevant to your profile tags and watch history",
                    "Customising your dashboard and homepage experience",
                  ],
                },
                {
                  h: "Safety & Legal Compliance",
                  items: [
                    "Detecting and preventing fraud, abuse, and policy violations",
                    "Preserving marketplace chat logs for dispute resolution",
                    "Responding to law-enforcement requests and legal obligations",
                    "Enforcing our Terms & Conditions and Acceptable Use Policy",
                  ],
                },
              ].map((g) => (
                <div key={g.h} className="mb-4">
                  <h3 className="text-[14px] font-semibold text-text-primary mb-2">{g.h}</h3>
                  <Ul>
                    {g.items.map((i) => <Li key={i}>{i}</Li>)}
                  </Ul>
                </div>
              ))}
            </Section>

            {/* ── 4 ── */}
            <Section id="sharing" title="4. Information Sharing & Third Parties">
              <P>We <strong>do not sell or rent</strong> your personal information to any third party, ever. Sharing occurs only in the following circumstances:</P>

              <div className="space-y-3 mt-4">
                {[
                  {
                    name: "Stripe",
                    role: "Payment Processing & Seller Onboarding",
                    data: "Transaction amounts, user identifiers, seller onboarding data.",
                    link: "stripe.com/privacy",
                  },
                  {
                    name: "Amazon Web Services (AWS)",
                    role: "Video Storage, Streaming & Transcoding",
                    data: "Video files, thumbnails, images stored in S3. Transcoding jobs via MediaConvert.",
                    link: "aws.amazon.com/privacy",
                  },
                  {
                    name: "Google Firebase",
                    role: "Authentication & Marketplace Chat",
                    data: "Google OAuth tokens (auth), marketplace chat messages (Firestore).",
                    link: "firebase.google.com/support/privacy",
                  },
                  {
                    name: "EmailJS / SMTP",
                    role: "Transactional Email",
                    data: "Recipient email, OTP codes, notification content. No persistent storage.",
                    link: "emailjs.com/legal/privacy-policy",
                  },
                  {
                    name: "Google Analytics",
                    role: "Usage Analytics (only with your consent)",
                    data: "Pages viewed, device and browser type, approximate location and page-load timings. Advertising features are turned off.",
                    link: "policies.google.com/privacy",
                  },
                  {
                    name: "Meta Platforms",
                    role: "Ad Measurement: Meta Pixel (only with your consent)",
                    data: "Public pages visited and a browser identifier, used to measure our Facebook and Instagram ads.",
                    link: "www.facebook.com/privacy/policy",
                  },
                ].map((sp) => (
                  <div key={sp.name} className="flex gap-4 p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                    <div className="w-2 rounded-full shrink-0" style={{ backgroundColor: "var(--color-accent-primary)" }} />
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-text-primary">{sp.name}</h4>
                      <p className="text-[12.5px] text-text-tertiary mt-0.5">{sp.role}</p>
                      <p className="text-[12.5px] text-text-secondary mt-1">{sp.data}</p>
                      <a href={`https://${sp.link}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-accent-primary mt-1 inline-block hover:underline">{sp.link}</a>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-[14.5px] font-semibold text-text-primary mt-5 mb-2">Other Disclosure Scenarios</h3>
              <Ul>
                <Li><strong>Legal Requirements:</strong> Court orders, subpoenas, governmental requests, or prevention of harm.</Li>
                <Li><strong>Business Transfers:</strong> Merger, acquisition, or asset sale. We will notify affected users.</Li>
                <Li><strong>Marketplace Visibility:</strong> Your public profile (username, avatar, listings) is visible to other users. Transaction summaries (not payment data) are shared between buyer and seller in an order.</Li>
              </Ul>

              <InfoBox variant="info">
                <strong>Note:</strong> Shipping addresses stored for marketplace orders are AES-256-CBC encrypted at rest and are only decrypted when preparing an order for fulfilment.
              </InfoBox>
            </Section>

            {/* ── 5 ── */}
            <Section id="security" title="5. Data Security & Technical Safeguards">
              <P>WeCinema implements industry-standard technical and organisational security measures:</P>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {[
                  { icon: "🔐", title: "Password Hashing",       desc: "All passwords are hashed using Argon2id, the current OWASP-recommended algorithm. Plaintext passwords are never stored." },
                  { icon: "🔑", title: "JWT Authentication",     desc: "Access tokens expire in 15 minutes and are kept in memory only. Refresh tokens (30 days, rotated on every use) live in a __Host- prefixed, httpOnly, Secure, SameSite cookie, inaccessible to JavaScript." },
                  { icon: "🛡️", title: "Transport Encryption",   desc: "All traffic between your browser and our servers is encrypted with TLS 1.2+. HSTS is enforced." },
                  { icon: "📦", title: "Storage Encryption",     desc: "Shipping addresses: AES-256-CBC. AWS S3 objects: server-side encryption (SSE-S3). Video delivery via short-lived presigned URLs (24-hour TTL)." },
                  { icon: "🚫", title: "Input Sanitisation",     desc: "All user input is validated and sanitised. MongoDB operators are stripped. Prototype pollution is actively blocked via middleware." },
                  { icon: "⏱️", title: "Rate Limiting",          desc: "Authentication endpoints: 15 req/min. Payment endpoints: 5 req/min. Write operations: 10 req/30 min, mitigating brute-force attacks." },
                  { icon: "🔒", title: "Token Revocation",       desc: "Logout immediately blacklists the token's JTI. Incrementing tokenVersion globally revokes all active sessions for a user." },
                  { icon: "💳", title: "PCI-DSS Compliance",    desc: "Payments are fully delegated to Stripe, a PCI-DSS Level 1 certified processor. WeCinema never touches raw card data." },
                ].map((item) => (
                  <div key={item.title} className="p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{item.icon}</span>
                      <h4 className="text-[13.5px] font-semibold text-text-primary">{item.title}</h4>
                    </div>
                    <p className="text-[12.5px] text-text-tertiary leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <InfoBox variant="warning">
                <strong>Security Incidents:</strong> In the event of a data breach affecting your personal information, we will notify affected users and relevant supervisory authorities within 72 hours of becoming aware, as required by applicable law.
              </InfoBox>
            </Section>

            {/* ── 6 ── */}
            <Section id="retention" title="6. Data Retention">
              <P>We retain personal data only as long as necessary for the purpose it was collected, or as required by law:</P>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="border-b border-divider">
                      <th className="text-left py-2.5 pr-4 text-text-primary font-semibold">Data Type</th>
                      <th className="text-left py-2.5 pr-4 text-text-primary font-semibold">Retention Period</th>
                      <th className="text-left py-2.5 text-text-primary font-semibold">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    {[
                      ["Active account data",           "Duration of account",      "Service provision"],
                      ["Deleted account data",          "90 days post-deletion",    "Dispute resolution & abuse prevention"],
                      ["Order & payment records",       "7 years",                  "Tax, accounting & legal compliance"],
                      ["Marketplace chat logs",         "2 years",                  "Dispute resolution"],
                      ["Video content",                 "Until creator deletes",    "Content hosting agreement"],
                      ["Security & access logs",        "12 months",                "Security monitoring"],
                      ["OTP codes",                     "10 minutes",               "One-time use, auto-expired"],
                      ["JWT refresh tokens",            "30 days",                  "Authentication lifecycle"],
                      ["Cookie consent records",        "3 years",                  "Proof of consent (GDPR)"],
                    ].map(([type, period, reason]) => (
                      <tr key={type} className="border-b border-divider/50">
                        <td className="py-2.5 pr-4 font-medium text-text-primary">{type}</td>
                        <td className="py-2.5 pr-4">{period}</td>
                        <td className="py-2.5">{reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <P>To request early deletion of your data, see Section 7 (Your Rights) or contact privacy@wecinema.co.</P>
            </Section>

            {/* ── 7 ── */}
            <Section id="rights" title="7. Your Rights & Choices">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                {[
                  { icon: "👁️", title: "Access",      desc: "Receive a copy of your personal data we hold." },
                  { icon: "✏️", title: "Correction",  desc: "Correct inaccurate or incomplete data." },
                  { icon: "🗑️", title: "Deletion",    desc: "Request deletion of your account and data." },
                  { icon: "📦", title: "Portability", desc: "Export your data in a machine-readable format." },
                  { icon: "⛔", title: "Objection",   desc: "Object to processing based on legitimate interests." },
                  { icon: "🚫", title: "Restriction", desc: "Request restriction of processing in certain cases." },
                  { icon: "📧", title: "Opt-Out",     desc: "Unsubscribe from marketing emails at any time." },
                  { icon: "🔄", title: "Withdraw",    desc: "Withdraw consent where processing is consent-based." },
                ].map((r) => (
                  <div key={r.title} className="p-4 rounded-xl text-center bg-bg-secondary border border-border-secondary">
                    <span className="text-2xl block mb-1.5">{r.icon}</span>
                    <h4 className="text-[12.5px] font-semibold text-text-primary mb-1">{r.title}</h4>
                    <p className="text-[11.5px] text-text-tertiary leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
              <P>To exercise any of these rights, email <strong>privacy@wecinema.co</strong> with your account email and the specific request. We will respond within 30 days (or 72 hours for urgent security concerns).</P>
              <P>You may also delete your account directly from your account settings. This triggers immediate deactivation and schedules all associated data for deletion within 90 days.</P>
            </Section>

            {/* ── 8 ── */}
            <Section id="cookies" title="8. Cookies & Tracking">
              <P>WeCinema asks before using any cookie that isn&apos;t strictly necessary. Until you choose, only strictly necessary cookies are used, and you can change your choice at any time from <strong>Cookie settings</strong> in the site footer.</P>
              <div className="space-y-2.5 mt-3">
                {[
                  {
                    type: "Strictly Necessary",
                    color: "var(--color-success)",
                    bg: "var(--color-success-bg)",
                    desc: "Keep you signed in (a Secure, httpOnly refresh cookie), remember your cookie choices and the preferences you set yourself, such as light or dark mode, and let checkout work. Stripe and PayPal set fraud-prevention cookies when a payment form opens. Always on.",
                  },
                  {
                    type: "Functional",
                    color: "var(--color-info)",
                    bg: "var(--color-info-bg)",
                    desc: "Remember your recent searches. Off unless you allow it.",
                  },
                  {
                    type: "Analytics",
                    color: "var(--color-warning)",
                    bg: "var(--color-warning-bg)",
                    desc: "Google Analytics measures how the site is used and how fast pages load, with Google's advertising features turned off. Off unless you allow it.",
                  },
                  {
                    type: "Marketing",
                    color: "var(--color-danger)",
                    bg: "var(--color-danger-bg)",
                    desc: "The Meta Pixel measures how our ads on Facebook and Instagram perform, on public pages only. Off unless you allow it.",
                  },
                ].map((c) => (
                  <div key={c.type} className="flex gap-3 p-4 rounded-xl items-start" style={{ backgroundColor: c.bg }}>
                    <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: c.color }} />
                    <div>
                      <strong className="text-[13.5px] text-text-primary">{c.type}:</strong>
                      <span className="text-[13px] text-text-secondary ml-1">{c.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <P>You may clear browser cookies and localStorage at any time, but strictly necessary cookies are required to stay logged in.</P>
            </Section>

            {/* ── 9 ── */}
            <Section id="transfers" title="9. International Data Transfers">
              <P>WeCinema servers are operated by Amazon Web Services in the <strong>US East (Ohio, us-east-2)</strong> region. If you access the platform from outside the United States, your data is transferred to and processed in the United States.</P>
              <P>For users in the European Economic Area (EEA) or United Kingdom, such transfers are made under standard contractual clauses (SCCs) or other lawful transfer mechanisms recognised under applicable data protection law.</P>
              <P>By using WeCinema, you consent to this international transfer and processing of your personal data.</P>
            </Section>

            {/* ── 10 ── */}
            <Section id="children" title="10. Children's Privacy">
              <InfoBox variant="warning">
                <strong>Age Restriction:</strong> WeCinema is strictly for users aged 18 and over. The marketplace, payment processing, and some content categories are not appropriate for minors.
              </InfoBox>
              <P>We do not knowingly collect personal information from anyone under 18. If we discover that a minor has created an account, we will immediately terminate the account and delete all associated data. If you believe a minor has registered, please contact privacy@wecinema.co immediately.</P>
            </Section>

            {/* ── 11 ── */}
            <Section id="gdpr" title="11. GDPR Compliance (EEA & UK Users)">
              <P>If you are located in the European Economic Area or United Kingdom, the General Data Protection Regulation (GDPR / UK GDPR) gives you additional rights and protections:</P>
              <h3 className="text-[14px] font-semibold text-text-primary mt-4 mb-2">Legal Bases for Processing</h3>
              <Ul>
                {[
                  ["Contract",               "Processing necessary to provide you with platform services (account, orders, payments)."],
                  ["Legitimate Interests",   "Fraud prevention, security monitoring, platform improvement, balanced against your rights."],
                  ["Legal Obligation",       "Financial record-keeping, responding to lawful requests from authorities."],
                  ["Consent",                "Marketing emails, and analytics and marketing cookies, withdrawable at any time from Cookie settings."],
                ].map(([basis, detail]) => (
                  <Li key={basis}><strong>{basis}:</strong> {detail}</Li>
                ))}
              </Ul>
              <P>Our Data Protection contact for GDPR inquiries is <strong>privacy@wecinema.co</strong>. You also have the right to lodge a complaint with your local supervisory authority (e.g., the ICO in the UK, or your national DPA in the EEA).</P>
            </Section>

            {/* ── 12 ── */}
            <Section id="ccpa" title="12. CCPA Rights (California Residents)">
              <P>Under the California Consumer Privacy Act (CCPA), California residents have the right to:</P>
              <Ul>
                <Li><strong>Know:</strong> What personal information is collected, used, shared, or sold.</Li>
                <Li><strong>Delete:</strong> Request deletion of personal information we hold about you.</Li>
                <Li><strong>Opt-Out of Sale:</strong> WeCinema does not sell personal information. This right is automatically satisfied.</Li>
                <Li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising any CCPA right.</Li>
              </Ul>
              <P>To submit a verifiable California consumer request, email privacy@wecinema.co with subject line "CCPA Request" from your registered account email. We will respond within 45 days.</P>
            </Section>

            {/* ── 13 ── */}
            <Section id="changes" title="13. Changes to This Policy">
              <P>We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or for other reasons. When we make material changes:</P>
              <Ul>
                <Li>We will post the updated policy with a revised effective date.</Li>
                <Li>We will notify registered users via email at least 30 days before major changes take effect.</Li>
                <Li>Continued use of the platform after the effective date constitutes acceptance.</Li>
                <Li>Previous versions are archived and available upon request.</Li>
              </Ul>
            </Section>

            {/* ── 14 ── */}
            <Section id="contact" title="14. Contact & Data Controller">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {[
                  { label: "Privacy Enquiries",       email: "privacy@wecinema.co",  desc: "Data rights, deletion requests, GDPR/CCPA." },
                  { label: "General Support",         email: "support@wecinema.co",  desc: "Platform help, account issues." },
                  { label: "Legal & Compliance",      email: "legal@wecinema.co",    desc: "DMCA, legal notices, court orders." },
                  { label: "Business & Partnerships", email: "hello@wecinema.co",    desc: "Partnerships, press, commercial inquiries." },
                ].map((c) => (
                  <div key={c.label} className="p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                    <h4 className="text-[13px] font-semibold text-text-primary mb-1">{c.label}</h4>
                    <a href={`mailto:${c.email}`} className="text-accent-primary text-[13px] hover:underline">{c.email}</a>
                    <p className="text-[12px] text-text-tertiary mt-1">{c.desc}</p>
                  </div>
                ))}
              </div>
              <P>WeCinema operates as the Data Controller for personal information collected through wecinema.co.</P>
            </Section>

            {/* Footer strip */}
            <div className="mt-8 p-6 rounded-2xl text-center" style={{ background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-hover))" }}>
              <h3 className="text-[17px] font-semibold text-white mb-1">Your Privacy Matters</h3>
              <p className="text-[13px] text-white/85 leading-relaxed">
                Questions about this policy? Contact <strong>privacy@wecinema.co</strong>
              </p>
            </div>

            <p className="text-center text-[12px] text-text-tertiary mt-5">
              Effective {EFFECTIVE_DATE} · Version 3.0 · WeCinema Video Platform · wecinema.co
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
