"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  ChevronDown,
  Clapperboard,
  Film,
  Globe,
  Handshake,
  KeyRound,
  Lock,
  MessageSquare,
  Moon,
  PenLine,
  Play,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  Upload,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";

/* ===========================================================================
   WeCinema — Awareness / campaign landing page (/welcome)
   Self-contained: own slim header + footer, no app sidebar — focused on
   converting cold ad traffic. Cinematic gold-on-black brand styling.
   =========================================================================== */

const GOLD = "#FFBB00";

/* shared spacing rhythm */
const SECTION = "py-20 sm:py-28";
const CONTAINER = "max-w-[1180px] mx-auto px-5 sm:px-6";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* standardized section heading — keeps vertical rhythm consistent */
function SectionHead({
  eyebrow,
  title,
  sub,
  className,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  className?: string;
}) {
  return (
    <Reveal className={`text-center max-w-[660px] mx-auto mb-12 sm:mb-16 ${className ?? ""}`}>
      <span className="text-[12.5px] font-bold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
        {eyebrow}
      </span>
      <h2
        className="mt-2.5 text-text-primary font-extrabold"
        style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.65rem, 3.6vw, 2.35rem)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      {sub && <p className="mt-3.5 text-[15px] sm:text-[16px] text-text-tertiary leading-relaxed">{sub}</p>}
    </Reveal>
  );
}

/* count-up that fires when scrolled into view */
function CountUp({ to, suffix = "", duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* horizontal auto-scrolling marquee of pills */
function Marquee({ items, reverse = false, duration = 32 }: { items: string[]; reverse?: boolean; duration?: number }) {
  return (
    <div
      className="relative overflow-hidden py-1.5"
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)",
      }}
    >
      <motion.div
        className="flex gap-3 w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap bg-bg-elevated border border-border-secondary text-text-secondary"
          >
            <span style={{ color: GOLD }}>●</span>
            {t}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* subtle dot-grid texture layer (theme-aware, fades at edges) */
function DotGrid({ isDark }: { isDark: boolean }) {
  const c = isDark ? "rgba(255,255,255,0.05)" : "rgba(15,15,15,0.045)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(${c} 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
        maskImage: "radial-gradient(ellipse 78% 60% at 50% 38%, #000 28%, transparent 76%)",
        WebkitMaskImage: "radial-gradient(ellipse 78% 60% at 50% 38%, #000 28%, transparent 76%)",
      }}
    />
  );
}

/* --------------------------------- data --------------------------------- */

const STATS = [
  { value: "4K", label: "Source uploads" },
  { value: "100%", label: "Escrow protected" },
  { value: "24/7", label: "AI film assistant" },
  { value: "0", label: "Cost to join" },
];

const COUNTERS = [
  { to: 9, suffix: "", label: "Film genres" },
  { to: 18, suffix: "", label: "Story themes" },
  { to: 4, suffix: "", label: "Ways to earn" },
  { to: 6, suffix: "", label: "Creator types" },
];

const GENRES = ["Action", "Adventure", "Comedy", "Documentary", "Drama", "Horror", "Mystery", "Romance", "Thriller"];
const THEMES = ["Love", "Redemption", "Survival", "Revenge", "Justice", "Freedom", "Hope", "Bravery", "Friendship", "Society"];

const PILLARS = [
  {
    icon: <Wallet size={22} />,
    title: "Creator-to-buyer, no middlemen",
    desc: "Set your own price and sell directly to a global audience of buyers. Keep more of every sale.",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Escrow on every order",
    desc: "Stripe holds funds until delivery is confirmed. Buyers purchase with zero risk, sellers get paid for confirmed work.",
  },
  {
    icon: <Repeat size={22} />,
    title: "Four ways to monetize",
    desc: "Sell finished films, license rights, sell adaptation rights, or take custom commissions: one platform, every model.",
  },
  {
    icon: <Clapperboard size={22} />,
    title: "Built for filmmakers",
    desc: "4K uploads, adaptive streaming, order-linked chat, and an AI assistant trained for film. Made by people who get the craft.",
  },
];

const MODELS = [
  { icon: <ShoppingBag size={20} />, title: "For Sale", desc: "Direct purchase of finished films and video content." },
  { icon: <Globe size={20} />, title: "Licensing", desc: "Commercial, broadcast, and digital distribution rights." },
  { icon: <Repeat size={20} />, title: "Adaptation Rights", desc: "License remakes, sequels, and derivative works." },
  { icon: <Handshake size={20} />, title: "Commission", desc: "Custom work created to a buyer's brief." },
];

const STEPS = [
  {
    icon: <Upload size={20} />,
    title: "Upload & list",
    desc: "Sellers upload films with descriptions, pricing, and requirements, free to list.",
  },
  {
    icon: <ShoppingBag size={20} />,
    title: "Discover & order",
    desc: "Buyers browse, chat with creators, negotiate, and place a secure order.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Deliver via escrow",
    desc: "Sellers deliver, buyers review, and payment releases only on confirmed delivery.",
  },
  {
    icon: <Star size={20} />,
    title: "Build a reputation",
    desc: "Ratings, reviews, and HypeMode discovery turn great work into repeat business.",
  },
];

const CREATOR_TYPES = [
  { icon: <Clapperboard size={20} />, label: "Actor" },
  { icon: <Building2 size={20} />, label: "Studio" },
  { icon: <Film size={20} />, label: "Filmmaker" },
  { icon: <PenLine size={20} />, label: "Writer" },
  { icon: <Bot size={20} />, label: "AI Creator" },
  { icon: <User size={20} />, label: "User" },
];

const SECURITY = [
  { icon: <ShieldCheck size={20} />, title: "Escrow on every order", desc: "Stripe authorizes funds upfront and releases only after delivery is confirmed." },
  { icon: <Lock size={20} />, title: "Bank-grade encryption", desc: "Shipping details are AES-256 encrypted; passwords hashed with Argon2, never stored in plaintext." },
  { icon: <KeyRound size={20} />, title: "Secure sign-in", desc: "Email OTP verification and Google sign-in, with short-lived tokens and instant revocation." },
  { icon: <BadgeCheck size={20} />, title: "Verified creators", desc: "Seller ratings, reviews, and verified badges so buyers always know who they're working with." },
];

const FAQS = [
  {
    q: "Is WeCinema free to join?",
    a: "Yes. Creating an account, browsing the marketplace, and listing your work is completely free. Sellers only pay a platform fee when a sale actually completes.",
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
    a: "HypeMode is a premium tier that gives your listings a trending badge, priority placement in discovery, push notifications to buyers, and a reduced platform fee from 30% down to 15% on HypeMode sales.",
  },
  {
    q: "Who is WeCinema for?",
    a: "Independent filmmakers, scriptwriters, actors, studios, and AI creators who want to monetize their work, and the production companies, studios, and filmmakers looking to source films, scripts, licensing, or custom video.",
  },
];

/* ------------------------------- sub-views ------------------------------- */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="wc-card-alt rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          {q}
        </span>
        <ChevronDown
          size={18}
          className="shrink-0 text-text-tertiary transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none", color: open ? GOLD : undefined }}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{ overflow: "hidden" }}
      >
        <p className="px-5 pb-5 text-[14px] leading-relaxed text-text-secondary">{a}</p>
      </motion.div>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export default function WelcomeLanding() {
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  // top scroll-progress bar
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Theme-aware values for the hand-styled cinematic sections (hero, HypeMode,
  // footer). Token-based sections adapt on their own.
  const heroBg = isDark
    ? "radial-gradient(1100px 520px at 50% -10%, rgba(255,187,0,0.16), transparent 60%), linear-gradient(180deg, #0A0A0F 0%, #0C0B12 55%, #0A0A0F 100%)"
    : "radial-gradient(1100px 520px at 50% -10%, rgba(255,187,0,0.18), transparent 62%), linear-gradient(180deg, #FFFFFF 0%, #FBF8F1 55%, #FFFFFF 100%)";
  const heroText = isDark ? "#FFFFFF" : "#0B0A0F";
  const heroSub = isDark ? "rgba(255,255,255,0.70)" : "rgba(15,15,15,0.64)";
  const heroMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,15,15,0.5)";
  const filmLineColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)";
  const filmLineOpacity = isDark ? 0.06 : 0.04;
  const stripWrapBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const stripCellBg = isDark ? "#0B0A11" : "#FFFFFF";

  const hypeBg = isDark
    ? "radial-gradient(700px 300px at 50% 0%, rgba(255,187,0,0.18), transparent 60%), linear-gradient(180deg, #0C0B12, #08070C)"
    : "radial-gradient(700px 300px at 50% 0%, rgba(255,187,0,0.16), transparent 62%), linear-gradient(180deg, #1A1812, #100E08)";

  // theme-aware elevation tokens consumed by the scoped CSS below
  const themeVars = {
    "--wc-shadow": isDark
      ? "0 1px 0 0 rgba(255,255,255,0.04), 0 18px 40px -28px rgba(0,0,0,0.8)"
      : "0 1px 2px rgba(16,24,40,0.05), 0 14px 30px -18px rgba(16,24,40,0.16)",
    "--wc-shadow-hover": isDark
      ? "0 0 0 1px rgba(255,187,0,0.18), 0 26px 52px -22px rgba(0,0,0,0.95)"
      : "0 22px 46px -18px rgba(16,24,40,0.22)",
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary" style={themeVars}>
      <style>{`
        .wc-card, .wc-card-alt {
          box-shadow: var(--wc-shadow);
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
          will-change: transform;
        }
        .wc-card { background: var(--color-card-bg); border: 1px solid var(--color-card-border); }
        .wc-card-alt { background: var(--color-bg-elevated); border: 1px solid var(--color-border-secondary); }
        .wc-lift:hover {
          transform: translateY(-5px);
          box-shadow: var(--wc-shadow-hover);
          border-color: color-mix(in srgb, ${GOLD} 40%, var(--color-card-border));
        }
        .wc-ico { transition: transform .3s cubic-bezier(.22,1,.36,1); }
        .wc-lift:hover .wc-ico { transform: scale(1.1) rotate(-3deg); }
        @media (prefers-reduced-motion: reduce) {
          .wc-card, .wc-card-alt, .wc-ico { transition: none; }
          .wc-lift:hover { transform: none; }
        }
      `}</style>

      {/* scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[70] h-[3px] origin-left"
        style={{ scaleX: progress, background: `linear-gradient(90deg, ${GOLD}, #FFD24D)` }}
        aria-hidden
      />

      {/* ------------------------------ Header ------------------------------ */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled
            ? "color-mix(in srgb, var(--color-bg-primary) 78%, transparent)"
            : "color-mix(in srgb, var(--color-bg-primary) 60%, transparent)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: `1px solid ${scrolled ? "var(--color-divider)" : "transparent"}`,
          boxShadow: scrolled ? "0 8px 24px -18px rgba(0,0,0,0.4)" : "none",
        }}
      >
        <div className={`${CONTAINER} h-[60px] flex items-center justify-between`}>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/wecinema.webp" alt="WeCinema" width={34} height={34} className="rounded-lg" priority />
            <span className="text-[18px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              We<span style={{ color: GOLD }}>Cinema</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-[14px] font-semibold text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#how" className="hover:text-text-primary transition-colors">How it works</a>
            <a href="#models" className="hover:text-text-primary transition-colors">Marketplace</a>
            <a href="#faq" className="hover:text-text-primary transition-colors">FAQ</a>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/explore"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-[14px] font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <Play size={15} /> Watch
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary border border-border-secondary bg-bg-elevated transition-colors hover:text-text-primary hover:border-border-primary"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[14px] font-bold transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: GOLD, color: "#000" }}
            >
              Get started <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      </header>

      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden" style={{ background: heroBg }}>
        {/* film-strip glow lines */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: filmLineOpacity,
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0 38px, ${filmLineColor} 38px 40px)`,
          }}
        />
        {/* floating glow orbs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,187,0,0.22), transparent 70%)", filter: "blur(20px)" }}
          animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-20 w-[460px] h-[460px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,210,77,0.18), transparent 70%)", filter: "blur(20px)" }}
          animate={{ x: [0, -36, 0], y: [0, -28, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
        />

        <div className={`relative ${CONTAINER} pt-20 pb-16 sm:pt-28 sm:pb-20 text-center`}>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <span
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold mb-6"
                style={{ color: GOLD, backgroundColor: "rgba(255,187,0,0.10)", border: "1px solid rgba(255,187,0,0.28)" }}
              >
                <Sparkles size={13} /> The home of independent film
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="font-extrabold leading-[1.04] tracking-tight mx-auto max-w-[940px]"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.3rem, 6vw, 4.1rem)", letterSpacing: "-0.03em", color: heroText }}
            >
              Buy, Sell &amp; Stream{" "}
              <span
                style={{
                  background: `linear-gradient(120deg, ${GOLD}, #FFD24D)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Independent Films
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-[640px] mt-6 text-[16px] sm:text-[18px] leading-relaxed"
              style={{ color: heroSub }}
            >
              Upload films, sell scripts, license rights, and network with filmmakers, and
              turn your creativity into currency, protected by Stripe escrow on every order.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-3 mt-9"
            >
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: GOLD, color: "#000", boxShadow: "0 14px 40px -12px rgba(255,187,0,0.5)" }}
              >
                Start selling free <ArrowRight size={17} />
              </Link>
              <Link
                href="/marketplace/browse"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold backdrop-blur-sm transition-colors"
                style={{
                  color: heroText,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)"}`,
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                }}
              >
                <ShoppingBag size={16} /> Browse the marketplace
              </Link>
            </motion.div>

            {/* social proof line */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-2 mt-6 text-[13px]"
              style={{ color: heroMuted }}
            >
              <span className="flex" style={{ color: GOLD }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={15} fill={GOLD} strokeWidth={0} />
                ))}
              </span>
              Loved by independent creators &amp; buyers worldwide
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-5 text-[13px]"
              style={{ color: heroMuted }}
            >
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck size={15} style={{ color: GOLD }} /> Free to join
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={15} style={{ color: GOLD }} /> Escrow protected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={15} style={{ color: GOLD }} /> Fee on sales only
              </span>
            </motion.div>
          </motion.div>

          {/* stat strip */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-14 max-w-[840px] mx-auto rounded-2xl overflow-hidden"
            style={{ backgroundColor: stripWrapBg, border: `1px solid ${stripWrapBg}`, boxShadow: isDark ? "none" : "0 20px 50px -30px rgba(16,24,40,0.3)" }}
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="px-4 py-6 text-center"
                style={{ backgroundColor: stripCellBg }}
              >
                <div className="text-[26px] sm:text-[30px] font-extrabold" style={{ color: GOLD, fontFamily: "var(--font-heading)" }}>
                  {s.value}
                </div>
                <div className="text-[12px] mt-1" style={{ color: heroMuted }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* genre marquee at the foot of the hero */}
        <div className="relative pb-12 space-y-2.5">
          <Marquee items={GENRES} duration={34} />
          <Marquee items={THEMES} reverse duration={40} />
        </div>
      </section>

      {/* ----------------------------- Counters ----------------------------- */}
      <section className="border-b border-divider" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <div className={`${CONTAINER} py-14 sm:py-16 grid grid-cols-2 md:grid-cols-4 gap-8`}>
          {COUNTERS.map((c) => (
            <Reveal key={c.label} className="text-center">
              <div className="text-[36px] sm:text-[46px] font-extrabold leading-none" style={{ color: GOLD, fontFamily: "var(--font-heading)" }}>
                <CountUp to={c.to} suffix={c.suffix} />
              </div>
              <div className="text-[13px] mt-2.5 text-text-tertiary font-medium">{c.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------- Why WeCinema ---------------------------- */}
      <section id="features" className={`relative ${SECTION} scroll-mt-20`}>
        <DotGrid isDark={isDark} />
        <div className={`relative ${CONTAINER}`}>
          <SectionHead
            eyebrow="Why WeCinema"
            title="A marketplace built for film"
            sub="Direct relationships between creators and audiences: no gatekeepers, no surprises."
          />
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PILLARS.map((p) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="wc-card wc-lift rounded-2xl p-6"
              >
                <div
                  className="wc-ico w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ color: GOLD, backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)" }}
                >
                  {p.icon}
                </div>
                <h3 className="text-[16px] font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                  {p.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-text-tertiary">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --------------------------- Marketplace models --------------------------- */}
      <section id="models" className="scroll-mt-20" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <div className={`${CONTAINER} ${SECTION}`}>
          <SectionHead eyebrow="One platform, every model" title="Four ways to earn from your work" />
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((m, i) => (
              <Reveal key={m.title} delay={i * 0.05}>
                <div className="wc-card-alt wc-lift h-full rounded-2xl p-6">
                  <div
                    className="wc-ico w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ color: GOLD, backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)" }}
                  >
                    {m.icon}
                  </div>
                  <h3 className="text-[15px] font-bold text-text-primary mb-1.5" style={{ fontFamily: "var(--font-heading)" }}>
                    {m.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-text-tertiary">{m.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- AI assistant spotlight --------------------------- */}
      <section className={SECTION}>
        <div className={`${CONTAINER} grid gap-10 lg:gap-14 lg:grid-cols-2 items-center`}>
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
              <Bot size={15} /> WeCinema AI
            </span>
            <h2 className="mt-3 text-text-primary font-extrabold" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.55rem, 3.3vw, 2.15rem)", letterSpacing: "-0.02em" }}>
              An AI assistant built for film
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-text-secondary max-w-[520px]">
              Available 24/7 to help with uploads, marketplace, HypeMode, and payments, and to spark
              your next story with script ideas, character development, and filmmaking inspiration.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Get started guidance for uploads and listings",
                "Creative help: script ideas & story development",
                "Answers on payments, escrow, and HypeMode",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] text-text-secondary">
                  <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: GOLD }} /> {t}
                </li>
              ))}
            </ul>
            <Link
              href="/chatbot"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold mt-7 transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: GOLD, color: "#000" }}
            >
              Try WeCinema AI <ArrowRight size={16} />
            </Link>
          </Reveal>

          {/* chat mockup */}
          <Reveal delay={0.08}>
            <div className="wc-card rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-divider">
                <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: GOLD, color: "#000" }}>
                  <Bot size={20} />
                </span>
                <div>
                  <div className="text-[14px] font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>WeCinema AI</div>
                  <div className="text-[12px] text-text-tertiary flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-success)" }} /> Online: built for film
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="max-w-[85%] ml-auto px-4 py-2.5 rounded-2xl rounded-tr-sm text-[13.5px] font-medium" style={{ backgroundColor: GOLD, color: "#1A1300" }}>
                  How do I sell my short film and get paid safely?
                </div>
                <div className="max-w-[88%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-[13.5px] leading-relaxed bg-bg-tertiary text-text-secondary">
                  Upload it for free, set your price, and choose a listing type. Buyers pay into Stripe
                  escrow. You get paid the moment delivery is confirmed. Want help writing the listing?
                </div>
                <div className="max-w-[60%] ml-auto px-4 py-2.5 rounded-2xl rounded-tr-sm text-[13.5px] font-medium" style={{ backgroundColor: GOLD, color: "#1A1300" }}>
                  Yes, please!
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-full border border-border-secondary bg-bg-secondary text-[13px] text-text-tertiary">
                Ask me anything about WeCinema…
                <span className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-full" style={{ backgroundColor: GOLD, color: "#000" }}>
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ How it works ------------------------------ */}
      <section id="how" className="scroll-mt-20" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <div className={`${CONTAINER} ${SECTION}`}>
          <SectionHead
            eyebrow="Simple by design"
            title="How it works"
            sub="From upload to payout: streamlined and protected at every step."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07}>
                <div className="wc-card-alt wc-lift relative h-full rounded-2xl p-6">
                  <span
                    className="absolute -top-3 left-6 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold"
                    style={{ backgroundColor: GOLD, color: "#000" }}
                  >
                    {i + 1}
                  </span>
                  <div className="wc-ico mt-2 mb-3" style={{ color: GOLD }}>{s.icon}</div>
                  <h3 className="text-[15px] font-bold text-text-primary mb-1.5" style={{ fontFamily: "var(--font-heading)" }}>
                    {s.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-text-tertiary">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Creator types --------------------------- */}
      <section className={`relative ${SECTION}`}>
        <DotGrid isDark={isDark} />
        <div className={`relative ${CONTAINER}`}>
          <SectionHead
            eyebrow="For every kind of creator"
            title="Built for the whole industry"
            sub="Actors, studios, filmmakers, writers and AI creators. Pick up to three profile tags and show the world what you do."
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {CREATOR_TYPES.map((c, i) => (
              <Reveal key={c.label} delay={i * 0.04}>
                <div className="wc-card wc-lift h-full flex flex-col items-center text-center gap-3 rounded-2xl p-6">
                  <span
                    className="wc-ico w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ color: GOLD, backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)" }}
                  >
                    {c.icon}
                  </span>
                  <span className="text-[14px] font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>{c.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Sellers vs Buyers --------------------------- */}
      <section style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <div className={`${CONTAINER} ${SECTION} grid gap-6 lg:grid-cols-2`}>
          {/* Sellers */}
          <Reveal>
            <div className="wc-card-alt h-full rounded-3xl p-8 sm:p-10">
              <div className="inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.06em] mb-4" style={{ color: GOLD }}>
                <Film size={15} /> For creators
              </div>
              <h3 className="text-text-primary font-extrabold mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 2.6vw, 1.8rem)" }}>
                Your films deserve an audience
              </h3>
              <ul className="space-y-3 mb-7">
                {[
                  "List for free, pay only when a sale completes",
                  "4K uploads with automatic adaptive streaming",
                  "Negotiate offers directly with buyers, no middlemen",
                  "Get paid securely through Stripe or PayPal",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[14px] text-text-secondary">
                    <BadgeCheck size={17} className="shrink-0 mt-0.5" style={{ color: GOLD }} /> {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 mt-3 px-6 py-3 rounded-xl text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: GOLD, color: "#000" }}
              >
                Start selling free <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>

          {/* Buyers */}
          <Reveal delay={0.08}>
            <div className="wc-card-alt h-full rounded-3xl p-8 sm:p-10">
              <div className="inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.06em] mb-4" style={{ color: GOLD }}>
                <ShoppingBag size={15} /> For buyers
              </div>
              <h3 className="text-text-primary font-extrabold mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 2.6vw, 1.8rem)" }}>
                Source premium film &amp; video
              </h3>
              <ul className="space-y-3 mb-7">
                {[
                  "Browse free, no subscription required",
                  "Buy, license, adapt, or commission original work",
                  "Escrow protection: funds release only on delivery",
                  "Real-time chat with creators on every order",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[14px] text-text-secondary">
                    <ShieldCheck size={17} className="shrink-0 mt-0.5" style={{ color: GOLD }} /> {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/marketplace/browse"
                className="inline-flex items-center gap-2 mt-3 px-6 py-3 rounded-xl text-[14px] font-bold text-text-primary border border-border-primary transition-colors hover:bg-bg-tertiary"
              >
                Browse as buyer <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------- Security ------------------------------- */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHead
            eyebrow="Trust & safety"
            title="Secure by default, end to end"
            sub="Every transaction, sign-in, and message is protected, so you can focus on the work."
          />
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05}>
                <div className="wc-card wc-lift h-full rounded-2xl p-6">
                  <div
                    className="wc-ico w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ color: GOLD, backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)" }}
                  >
                    {s.icon}
                  </div>
                  <h3 className="text-[15px] font-bold text-text-primary mb-1.5" style={{ fontFamily: "var(--font-heading)" }}>{s.title}</h3>
                  <p className="text-[13px] leading-relaxed text-text-tertiary">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- HypeMode ------------------------------- */}
      <section className={`${CONTAINER} pb-20 sm:pb-28`}>
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center"
            style={{ background: hypeBg, border: "1px solid rgba(255,187,0,0.22)", boxShadow: "0 30px 70px -40px rgba(0,0,0,0.6)" }}
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,187,0,0.25), transparent 70%)", filter: "blur(10px)" }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
            />
            <div className="relative">
              <span
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-bold mb-5"
                style={{ color: GOLD, backgroundColor: "rgba(255,187,0,0.12)", border: "1px solid rgba(255,187,0,0.3)" }}
              >
                <Zap size={13} /> HypeMode
              </span>
              <h2 className="font-extrabold max-w-[680px] mx-auto" style={{ color: "#fff", fontFamily: "var(--font-heading)", fontSize: "clamp(1.55rem, 3.2vw, 2.15rem)", letterSpacing: "-0.02em" }}>
                Get discovered. Get trending. Earn more.
              </h2>
              <p className="mt-4 max-w-[600px] mx-auto text-[15px] leading-relaxed text-white/65">
                Upgrade to HypeMode for a trending badge, top search placement, push notifications to
                buyers, and a platform fee cut from 30% down to just 15% on HypeMode sales.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-5 mt-7 text-[13px] text-white/70">
                <span className="inline-flex items-center gap-1.5"><TrendingUp size={15} style={{ color: GOLD }} /> Priority placement</span>
                <span className="inline-flex items-center gap-1.5"><Sparkles size={15} style={{ color: GOLD }} /> Trending badge</span>
                <span className="inline-flex items-center gap-1.5"><Wallet size={15} style={{ color: GOLD }} /> 30% → 15% fee</span>
              </div>
              <Link
                href="/hypemode"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold mt-8 transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: GOLD, color: "#000" }}
              >
                Explore HypeMode <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* --------------------------------- FAQ --------------------------------- */}
      <section id="faq" className="scroll-mt-20" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <div className={`max-w-[780px] mx-auto px-5 sm:px-6 ${SECTION}`}>
          <SectionHead eyebrow="Questions, answered" title="Frequently asked" className="mb-10 sm:mb-12" />
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.04}>
                <FaqItem q={f.q} a={f.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ Final CTA ------------------------------ */}
      <section className="relative overflow-hidden px-5 py-20 sm:py-28 text-center" style={{ background: `linear-gradient(135deg, ${GOLD}, #FFD24D)` }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 38px, #000 38px 40px)" }}
        />
        <Reveal>
          <div className="relative">
            <h2 className="font-extrabold max-w-[680px] mx-auto" style={{ fontFamily: "var(--font-heading)", color: "#1A1300", fontSize: "clamp(1.8rem, 4vw, 2.7rem)", letterSpacing: "-0.02em" }}>
              Join the independent film revolution
            </h2>
            <p className="mt-4 max-w-[560px] mx-auto text-[15px] sm:text-[16px] leading-relaxed" style={{ color: "rgba(26,19,0,0.78)" }}>
              Create a free account and start uploading films, selling scripts, and building your
              filmmaking career today. No fees to list, only on sales.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: "#0A0A0F", color: "#fff", boxShadow: "0 16px 40px -14px rgba(0,0,0,0.5)" }}
              >
                Create free account <ArrowRight size={17} />
              </Link>
              <Link
                href="/chatbot"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold transition-colors hover:bg-black/5"
                style={{ color: "#1A1300", border: "2px solid rgba(26,19,0,0.35)" }}
              >
                <MessageSquare size={16} /> Ask WeCinema AI
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------- Footer ------------------------------- */}
      <footer style={{ backgroundColor: "var(--color-bg-secondary)", borderTop: "1px solid var(--color-divider)" }}>
        <div className={`${CONTAINER} py-12`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/wecinema.webp" alt="WeCinema" width={32} height={32} className="rounded-lg" />
              <span className="text-[17px] font-extrabold tracking-tight text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                We<span style={{ color: GOLD }}>Cinema</span>
              </span>
            </Link>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-text-secondary">
              <Link href="/explore" className="hover:text-text-primary transition-colors">Explore</Link>
              <Link href="/marketplace/browse" className="hover:text-text-primary transition-colors">Marketplace</Link>
              <Link href="/hypemode" className="hover:text-text-primary transition-colors">HypeMode</Link>
              <Link href="/about" className="hover:text-text-primary transition-colors">About</Link>
              <Link href="/support" className="hover:text-text-primary transition-colors">Support</Link>
              <Link href="/blog" className="hover:text-text-primary transition-colors">Blog</Link>
            </nav>
          </div>
          <div className="mt-8 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[12.5px] text-text-tertiary" style={{ borderTop: "1px solid var(--color-divider)" }}>
            <span>© {new Date().getFullYear()} WeCinema. All rights reserved.</span>
            <div className="flex gap-5">
              <Link href="/terms-and-conditions" className="hover:text-text-primary transition-colors">Terms</Link>
              <Link href="/privacy-policy" className="hover:text-text-primary transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
