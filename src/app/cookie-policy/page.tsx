import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { OG } from "@/lib/seo";
import { CookieSettingsButton } from "@/features/consent/components/CookieSettingsButton";
import { CATEGORY_INFO, STORAGE_LABEL, cookiesIn } from "@/features/consent/cookieRegistry";
import { CONSENT_CATEGORIES, CONSENT_POLICY_VERSION } from "@/features/consent/consentTypes";

const COOKIE_DESCRIPTION =
  "Which cookies and browser storage WeCinema uses, why, for how long, and how to change your choices at any time.";

export const metadata: Metadata = {
  title: { absolute: "Cookie Policy | WeCinema" },
  description: COOKIE_DESCRIPTION,
  alternates: { canonical: "/cookie-policy" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: "Cookie Policy | WeCinema",
    description: COOKIE_DESCRIPTION,
    images: [{ url: OG.privacy, width: 1200, height: 630, alt: "WeCinema Cookie Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | WeCinema",
    description: COOKIE_DESCRIPTION,
    images: [OG.privacy],
  },
};

const EFFECTIVE_DATE = "September 15, 2026";

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

const Li: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="text-[14px] leading-[1.8] pl-1 text-text-secondary">{children}</li>
);

const InfoBox: React.FC<{ children: React.ReactNode; variant?: "info" | "success" }> = ({ children, variant = "info" }) => {
  const color = variant === "success" ? "var(--color-success)" : "var(--color-info)";
  const bg = variant === "success" ? "var(--color-success-bg)" : "var(--color-info-bg)";
  return (
    <div className="px-5 py-4 rounded-xl text-[13.5px] leading-[1.75] my-4 text-text-primary" style={{ backgroundColor: bg, borderLeft: `4px solid ${color}` }}>
      {children}
    </div>
  );
};

const ExternalLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--color-text-link)" }}>
    {children}
  </a>
);

const TOC = [
  { id: "what",        label: "1. What Cookies Are" },
  { id: "how",         label: "2. How WeCinema Uses Them" },
  { id: "list",        label: "3. Every Cookie We Use" },
  { id: "third",       label: "4. Third Parties" },
  { id: "choices",     label: "5. Changing Your Choices" },
  { id: "gpc",         label: "6. Global Privacy Control" },
  { id: "browser",     label: "7. Browser Controls" },
  { id: "records",     label: "8. Records of Your Consent" },
  { id: "changes",     label: "9. Changes to This Policy" },
  { id: "contact",     label: "10. Contact" },
];

const THIRD_PARTIES = [
  { name: "Google Analytics", role: "Usage analytics, only with your consent.", href: "https://policies.google.com/privacy", label: "policies.google.com/privacy" },
  { name: "Meta Platforms", role: "Ad measurement (Meta Pixel), only with your consent, public pages only.", href: "https://www.facebook.com/privacy/policy", label: "facebook.com/privacy/policy" },
  { name: "Stripe", role: "Card payments and fraud prevention, when a checkout form opens.", href: "https://stripe.com/privacy", label: "stripe.com/privacy" },
  { name: "PayPal", role: "Subscription payments, when PayPal checkout opens.", href: "https://www.paypal.com/us/legalhub/privacy-full", label: "paypal.com privacy statement" },
  { name: "Google Firebase", role: "Sign in with Google and marketplace chat.", href: "https://firebase.google.com/support/privacy", label: "firebase.google.com/support/privacy" },
];

export default function CookiePolicyPage() {
  return (
    <Layout>
      <div className="bg-bg-primary p-4 sm:p-6 md:p-10">
        <div
          className="max-w-[900px] mx-auto bg-bg-elevated rounded-[20px] border border-border-secondary overflow-hidden"
          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}
        >
          {/* Accent bar */}
          <div className="h-1" style={{ background: "linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary))" }} />

          {/* Header */}
          <header className="px-6 sm:px-8 pt-10 pb-8 text-center border-b border-divider bg-bg-secondary">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01" />
              </svg>
            </div>
            <h1 className="text-[28px] font-bold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Cookie Policy
            </h1>
            <p className="text-[13.5px] text-text-tertiary max-w-md mx-auto leading-relaxed mb-4">
              Which cookies and browser storage WeCinema uses, why we use them, how long they last, and how you stay in control.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {[
                { label: "Effective Date", val: EFFECTIVE_DATE },
                { label: "Version",        val: CONSENT_POLICY_VERSION },
              ].map((item) => (
                <span key={item.label} className="px-3.5 py-1.5 rounded-lg text-[12px] bg-bg-elevated text-text-tertiary border border-border-secondary">
                  <strong className="text-text-primary">{item.label}:</strong> {item.val}
                </span>
              ))}
            </div>
          </header>

          <div className="px-4 sm:px-8 py-8">
            <InfoBox variant="success">
              <strong>Your choice comes first:</strong> WeCinema uses only strictly necessary cookies until you say otherwise. Analytics and marketing cookies are off unless you switch them on.
            </InfoBox>

            {/* Table of Contents */}
            <nav className="p-5 rounded-2xl bg-bg-secondary border border-border-secondary mb-2" aria-label="Table of contents">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Table of Contents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                {TOC.map((t) => (
                  <a key={t.id} href={`#${t.id}`} className="block py-1.5 px-2 text-[13px] rounded hover:bg-bg-elevated transition-colors" style={{ color: "var(--color-text-link)" }}>
                    {t.label}
                  </a>
                ))}
              </div>
            </nav>

            {/* ── 1 ── */}
            <Section id="what" title="1. What Cookies Are">
              <P>Cookies are small text files a website stores in your browser. Sites also use similar browser storage, such as local storage and IndexedDB. In this policy, &quot;cookies&quot; covers all of them.</P>
              <P>First-party cookies are set by wecinema.co itself. Third-party cookies are set by other services we use, such as Google or Stripe.</P>
            </Section>

            {/* ── 2 ── */}
            <Section id="how" title="2. How WeCinema Uses Them">
              <P>We sort every cookie into one of four categories:</P>
              <Ul>
                {CONSENT_CATEGORIES.map((category) => (
                  <Li key={category}>
                    <strong className="text-text-primary">{CATEGORY_INFO[category].title}:</strong> {CATEGORY_INFO[category].description}
                  </Li>
                ))}
              </Ul>
              <P>Strictly necessary cookies don&apos;t need your consent because the site can&apos;t work without them. Everything else waits for your permission, and nothing optional is loaded before you choose.</P>
            </Section>

            {/* ── 3 ── */}
            <Section id="list" title="3. Every Cookie We Use">
              {CONSENT_CATEGORIES.map((category) => (
                <div key={category} className="mt-6 first:mt-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-semibold text-text-primary">{CATEGORY_INFO[category].title}</h3>
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-semibold"
                      style={
                        category === "necessary"
                          ? { backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }
                          : { backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-tertiary)", border: "1px solid var(--color-border-secondary)" }
                      }
                    >
                      {category === "necessary" ? "Always on" : "Off unless you allow it"}
                    </span>
                  </div>
                  <P>{CATEGORY_INFO[category].description}</P>
                  <div className="overflow-x-auto mt-2 rounded-xl border border-border-secondary">
                    <table className="w-full min-w-[640px] text-[13px] border-collapse">
                      <thead className="bg-bg-secondary">
                        <tr>
                          {["Name", "Provider", "Purpose", "Duration", "Type"].map((heading) => (
                            <th key={heading} scope="col" className="text-left py-2.5 px-3 text-text-primary font-semibold">
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-text-secondary">
                        {cookiesIn(category).map((item) => (
                          <tr key={item.name} className="border-t border-divider align-top">
                            <td className="py-2.5 px-3"><code className="font-semibold text-text-primary break-all">{item.name}</code></td>
                            <td className="py-2.5 px-3">{item.provider}</td>
                            <td className="py-2.5 px-3">{item.purpose}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">{item.duration}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">{STORAGE_LABEL[item.storage]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </Section>

            {/* ── 4 ── */}
            <Section id="third" title="4. Third Parties">
              <P>These services may set cookies on WeCinema. Each handles that data under its own privacy policy:</P>
              <div className="space-y-3 mt-4">
                {THIRD_PARTIES.map((party) => (
                  <div key={party.name} className="flex gap-4 p-4 rounded-xl bg-bg-secondary border border-border-secondary">
                    <div className="w-2 rounded-full shrink-0" style={{ backgroundColor: "var(--color-accent-primary)" }} />
                    <div className="min-w-0">
                      <h3 className="text-[13.5px] font-semibold text-text-primary">{party.name}</h3>
                      <p className="text-[12.5px] text-text-secondary mt-0.5">{party.role}</p>
                      <p className="text-[12px] mt-1"><ExternalLink href={party.href}>{party.label}</ExternalLink></p>
                    </div>
                  </div>
                ))}
              </div>
              <P>Google Analytics runs with its advertising features switched off. The Meta Pixel never runs inside your account, such as dashboards, uploads or messages.</P>
            </Section>

            {/* ── 5 ── */}
            <Section id="choices" title="5. Changing Your Choices">
              <P>You can accept, reject or fine-tune cookies at any time. Your choice applies to this browser and is remembered for 6 months, after which we ask again.</P>
              <div className="my-4">
                <CookieSettingsButton
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl px-5 text-[13.5px] font-semibold transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ backgroundColor: "var(--color-accent-primary)", color: "var(--color-btn-primary-text)", outlineColor: "var(--color-text-primary)" }}
                >
                  Open cookie settings
                </CookieSettingsButton>
              </div>
              <P>When you withdraw consent, we delete the cookies that category had set and reload the page so its scripts stop running. The same settings are always available from <strong>Cookie settings</strong> in the site footer.</P>
            </Section>

            {/* ── 6 ── */}
            <Section id="gpc" title="6. Global Privacy Control">
              <P>If your browser or a privacy extension sends a <strong>Global Privacy Control</strong> (GPC) signal, we treat it as a refusal of analytics and marketing cookies. They stay off even if you choose &quot;Accept all&quot;, and the cookie settings show that the signal is active.</P>
            </Section>

            {/* ── 7 ── */}
            <Section id="browser" title="7. Browser Controls">
              <P>Most browsers also let you block or delete cookies. Blocking strictly necessary cookies will sign you out and stop parts of WeCinema from working.</P>
              <Ul>
                <Li><ExternalLink href="https://support.google.com/chrome/answer/95647">Google Chrome</ExternalLink></Li>
                <Li><ExternalLink href="https://support.mozilla.org/kb/clear-cookies-and-site-data-firefox">Mozilla Firefox</ExternalLink></Li>
                <Li><ExternalLink href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac">Apple Safari</ExternalLink></Li>
                <Li><ExternalLink href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09">Microsoft Edge</ExternalLink></Li>
              </Ul>
            </Section>

            {/* ── 8 ── */}
            <Section id="records" title="8. Records of Your Consent">
              <P>To show that we asked and what you chose, as data-protection law requires, we keep a record of each decision:</P>
              <Ul>
                <Li>a random consent ID, which is also stored in your <code>wc_consent</code> cookie</Li>
                <Li>the categories you allowed, the policy version and the date and time</Li>
                <Li>whether your browser sent Global Privacy Control</Li>
                <Li>a one-way hash of your shortened IP address (never the address itself) and your browser type</Li>
                <Li>your account, if you were signed in</Li>
              </Ul>
              <P>Consent records are deleted automatically after <strong>3 years</strong>.</P>
            </Section>

            {/* ── 9 ── */}
            <Section id="changes" title="9. Changes to This Policy">
              <P>When we start using a new kind of cookie, we update this policy and its version number, and ask for your choice again on your next visit.</P>
            </Section>

            {/* ── 10 ── */}
            <Section id="contact" title="10. Contact">
              <P>
                Questions about cookies or your data? Email{" "}
                <a href="mailto:privacy@wecinema.co" className="hover:underline" style={{ color: "var(--color-text-link)" }}>privacy@wecinema.co</a>.
                Our <a href="/privacy-policy" className="hover:underline" style={{ color: "var(--color-text-link)" }}>Privacy Policy</a> explains how we handle personal data more broadly.
              </P>
            </Section>

            <p className="text-center text-[12px] text-text-tertiary mt-8">
              Effective {EFFECTIVE_DATE} · Version {CONSENT_POLICY_VERSION} · WeCinema · wecinema.co
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
