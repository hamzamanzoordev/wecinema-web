"use client";

import {
  useState, useRef, useCallback, useEffect,
  type ReactNode, type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { IoMdHome } from "react-icons/io";
import { TbVideoPlus } from "react-icons/tb";
import {
  FaCrown, FaInfoCircle, FaShoppingCart, FaUserTie,
} from "react-icons/fa";
import {
  MdChatBubbleOutline, MdOutlineDescription, MdOutlinePrivacyTip,
  MdLocalOffer, MdOutlineArticle,
} from "react-icons/md";
import {
  RiAddCircleLine, RiFlagLine, RiListCheck, RiMessageLine,
  RiMovie2Line, RiShoppingBagLine, RiStoreLine, RiCustomerService2Line,
  RiFileList3Line,
} from "react-icons/ri";
import { X, Clapperboard } from "lucide-react";

import { SIDEBAR_COLLAPSED_W, SIDEBAR_EXPANDED_W } from "@/lib/constants";
import { useAuth } from "@/features/auth/context/AuthContext";

interface SidebarProps {
  expand: boolean;
  onClose?: () => void;
}

// ─── Portal Tooltip ───────────────────────────────────────────
const Tip = ({ label, children }: { label: string; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  return (
    <div
      ref={ref}
      className="w-full"
      onMouseEnter={() => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPos({ top: r.top + r.height / 2, left: r.right + 10 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && typeof document !== "undefined" &&
        createPortal(
          <div style={{
            position: "fixed", zIndex: 9999, pointerEvents: "none",
            top: pos.top, left: pos.left, transform: "translateY(-50%)",
            padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap",
            fontSize: 11.5, fontWeight: 600,
            backgroundColor: "var(--color-bg-inverse)",
            color: "var(--color-text-inverse)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            animation: "sbTip 0.12s ease-out",
          }}>
            {label}
          </div>,
          document.body,
        )}
    </div>
  );
};

// ─── NavItem ─────────────────────────────────────────────────
interface NavItemProps {
  href?: string;
  icon: ReactNode;
  label: string;
  expand: boolean;
  active?: boolean;
  gold?: boolean;
  danger?: boolean;
  badge?: ReactNode;
  as?: "button";
  onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}

const NavItem = ({
  href, icon, label, expand, active, gold, danger, badge, as: asEl, onClick,
}: NavItemProps) => {
  const [hovered, setHovered] = useState(false);

  const cls = [
    "relative flex items-center w-full rounded-xl transition-all duration-150 cursor-pointer select-none outline-none",
    "focus-visible:ring-2 focus-visible:ring-orange-400/40",
    expand ? "gap-3 px-3 py-2.5" : "justify-center py-3",
  ].join(" ");

  const style = active
    ? { color: "var(--color-accent-primary)", backgroundColor: "rgba(255,187,0,0.10)", fontWeight: 600 }
    : gold
      ? { color: "var(--color-accent-primary)", backgroundColor: hovered ? "rgba(255,187,0,0.07)" : "transparent" }
      : danger
        ? { color: "var(--color-danger,#EF4444)", backgroundColor: hovered ? "rgba(239,68,68,0.07)" : "transparent" }
        : { color: "var(--color-text-secondary)", backgroundColor: hovered ? "rgba(0,0,0,0.04)" : "transparent" };

  const events = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  const inner = (
    <>
      {active && (
        <span
          className="absolute inset-y-[8px] left-0 w-[3px] rounded-r-full sb-active-bar"
          style={{ background: "var(--color-accent-primary)" }}
        />
      )}
      <span className="flex-shrink-0 flex items-center justify-center text-[17px] leading-none">{icon}</span>
      {/* Always mounted (not conditionally rendered) — CSS transitions the
          opacity/width instead of a JS animation library, and the sidebar's
          own width transition covers the reveal. */}
      <span
        className="flex-1 text-[13px] leading-none truncate font-medium overflow-hidden whitespace-nowrap sb-nav-label"
        style={{ opacity: expand ? 1 : 0, maxWidth: expand ? 200 : 0 }}
      >
        {label}
      </span>
      {expand && badge && (
        <span className="flex-shrink-0 sb-badge-in">{badge}</span>
      )}
    </>
  );

  const wrapped = asEl === "button" ? (
    <button type="button" onClick={onClick as (e: MouseEvent<HTMLButtonElement>) => void} className={cls} style={style} {...events}>
      {inner}
    </button>
  ) : (
    <Link href={href ?? "#"} onClick={onClick as (e: MouseEvent<HTMLAnchorElement>) => void} className={cls} style={style} {...events}>
      {inner}
    </Link>
  );

  return !expand ? <Tip label={label}>{wrapped}</Tip> : wrapped;
};

// ─── Section label ────────────────────────────────────────────
const SectionLabel = ({ text, expand }: { text: string; expand: boolean }) =>
  expand ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 12px 6px" }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
    </div>
  ) : (
    <div style={{ margin: "10px 14px", height: 1, background: "var(--color-divider)", opacity: 0.6 }} />
  );

// ─── Marketplace Section ──────────────────────────────────────
const MarketplaceSection = ({
  expand, userMode, pathname,
}: {
  expand: boolean;
  userMode: "buyer" | "seller";
  pathname: string;
}) => {
  const isSeller = userMode === "seller";
  const modeColor = isSeller ? "#a78bfa" : "var(--color-accent-primary)";
  const modeBg    = isSeller ? "rgba(139,92,246,0.1)" : "rgba(255,187,0,0.1)";

  return (
    <div>
      <SectionLabel text="Marketplace" expand={expand} />

      {expand ? (
        <div style={{ paddingLeft: 12, paddingRight: 12, marginBottom: 6 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 9999,
            backgroundColor: modeBg, color: modeColor, border: `1px solid ${modeBg}`,
          }}>
            {isSeller ? <FaUserTie size={8} /> : <FaShoppingCart size={8} />}
            {isSeller ? "Seller Mode" : "Buyer Mode"}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 9999, backgroundColor: modeBg, color: modeColor }}>
            {isSeller ? "SELL" : "BUY"}
          </span>
        </div>
      )}

      <nav className="space-y-0.5">
        <NavItem href="/marketplace/browse" icon={<RiStoreLine />}      label="Browse"         expand={expand} active={pathname === "/marketplace/browse"} />
        <NavItem href="/marketplace/messages" icon={<RiMessageLine />}  label="Messages"       expand={expand} active={pathname === "/marketplace/messages"} />
        {isSeller ? (
          <>
            <NavItem href="/marketplace/listings/new"      icon={<RiAddCircleLine />} label="Create Listing" expand={expand} active={pathname === "/marketplace/listings/new"} />
            <NavItem href="/marketplace/dashboard/seller"  icon={<RiListCheck />}     label="Dashboard"      expand={expand} active={pathname === "/marketplace/dashboard/seller"} />
            <NavItem href="/marketplace/orders"            icon={<RiShoppingBagLine />} label="My Orders"    expand={expand} active={pathname === "/marketplace/orders"} />
            <NavItem href="/marketplace/deals"             icon={<MdLocalOffer />}    label="My Deals"       expand={expand} active={pathname.startsWith("/marketplace/deal")} />
            <NavItem href="/marketplace/analytics"         icon={<RiMovie2Line />}    label="Analytics"      expand={expand} active={pathname === "/marketplace/analytics"} />
          </>
        ) : (
          <>
            <NavItem href="/marketplace/dashboard/buyer"   icon={<RiListCheck />}     label="Dashboard"      expand={expand} active={pathname === "/marketplace/dashboard/buyer"} />
            <NavItem href="/marketplace/orders"            icon={<RiShoppingBagLine />} label="My Orders"    expand={expand} active={pathname === "/marketplace/orders"} />
            <NavItem href="/marketplace/deals"             icon={<MdLocalOffer />}    label="My Deals"       expand={expand} active={pathname.startsWith("/marketplace/deal")} />
            <NavItem href="/marketplace/listings/new"      icon={<RiAddCircleLine />} label="Create Listing" expand={expand} active={pathname === "/marketplace/listings/new"} />
          </>
        )}
      </nav>
    </div>
  );
};

// ─── Main Sidebar ─────────────────────────────────────────────
export default function Sidebar({ expand, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { authUser, isAuthenticated } = useAuth();
  const router = useRouter();

  const [userMode, setUserMode] = useState<"buyer" | "seller" | "">(() => {
    if (typeof window === "undefined") return "";
    return (authUser?.userType === "buyer" || authUser?.userType === "seller")
      ? authUser.userType
      : "";
  });

  // Sync userMode when authUser is refreshed (login, token restore, etc.)
  useEffect(() => {
    if (!authUser) { setUserMode(""); return; }
    if (authUser.userType === "buyer" || authUser.userType === "seller") {
      setUserMode(authUser.userType);
    }
  }, [authUser]);

  const isActive = (p: string) => pathname === p;
  const hasPaid = authUser?.hasPaid ?? false;
  // Marketplace is a subscription feature — hide its tabs once the sub expires
  // (the cron flips hasPaid to false on expiry). Backend also blocks writes.
  const showMarketplace =
    isAuthenticated && hasPaid && (userMode === "buyer" || userMode === "seller");

  const handleHypeModeClick = useCallback((e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (hasPaid) {
      e.preventDefault();
      toast.success("HypeMode Premium is active! Enjoy your access.", { icon: "👑", duration: 3000 });
      router.push("/hypemode");
    }
  }, [hasPaid, router]);

  return (
    <>
      <style>{`
        @keyframes sbTip { from{opacity:0;transform:translateY(-50%) translateX(-4px)} to{opacity:1;transform:translateY(-50%) translateX(0)} }
        @keyframes sbBadgeIn { from{opacity:0;transform:scale(0.75)} to{opacity:1;transform:scale(1)} }
        @keyframes sbBarIn { from{opacity:0;transform:scaleY(0.3)} to{opacity:1;transform:scaleY(1)} }
        @keyframes sbPopupIn { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .sb-nav-label { transition: opacity 0.14s ease, max-width 0.18s ease; }
        .sb-badge-in { animation: sbBadgeIn 0.15s ease forwards; }
        .sb-active-bar { animation: sbBarIn 0.15s ease forwards; }
        .sb-popup-in { animation: sbPopupIn 0.15s ease-out forwards; }
      `}</style>

      <aside
        className="flex flex-col h-full border-r overflow-hidden"
        style={{
          backgroundColor: "var(--color-nav-bg)",
          borderColor: "var(--color-divider)",
          width: expand ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W,
          transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
          {onClose && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px 6px" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                Menu
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 9999, border: "none",
                  background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)",
                  cursor: "pointer", transition: "background 0.15s",
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="px-1.5 py-3 pt-5 space-y-0.5">
            <nav className="space-y-0.5">
              <NavItem href="/" icon={<IoMdHome />} label="Home" expand={expand} active={isActive("/")} />
              <NavItem href="/shorts" icon={<Clapperboard size={17} />} label="Shorts" expand={expand} active={isActive("/shorts")} />
              <NavItem
                href={hasPaid ? "/hypemode" : "/pricing"}
                onClick={hasPaid ? handleHypeModeClick : undefined}
                icon={
                  <span className="relative inline-flex items-center justify-center">
                    <RiMovie2Line />
                    {hasPaid && (
                      <FaCrown className="absolute -top-2 -right-1.5 drop-shadow-sm" size={8} style={{ color: "#FFBB00" }} />
                    )}
                  </span>
                }
                label="Hype Mode"
                expand={expand}
                active={isActive("/explore") || isActive("/hypemode")}
                gold={hasPaid}
                badge={hasPaid
                  ? <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 9999, backgroundColor: "rgba(255,187,0,0.1)", color: "#FFBB00", border: "1px solid rgba(255,187,0,0.2)" }}>PRO</span>
                  : undefined}
              />
              <NavItem href="/video-editor" icon={<TbVideoPlus />}        label="Video Editor" expand={expand} active={isActive("/video-editor")} />
              <NavItem href="/chatbot"      icon={<MdChatBubbleOutline />} label="AI ChatBot"   expand={expand} active={isActive("/chatbot")} />
              <NavItem href="/scripts"      icon={<RiFileList3Line />}     label="Scripts"      expand={expand} active={pathname.startsWith("/scripts")} />
            </nav>

            {showMarketplace && (
              <MarketplaceSection
                expand={expand}
                userMode={userMode as "buyer" | "seller"}
                pathname={pathname}
              />
            )}

            <SectionLabel text="More" expand={expand} />

            <nav className="space-y-0.5">
              <NavItem href="/blog"                 icon={<MdOutlineArticle />}      label="Blog"    expand={expand} active={pathname.startsWith("/blog")} />
              <NavItem href="/about"                icon={<FaInfoCircle />}           label="About"   expand={expand} active={isActive("/about")} />
              <NavItem href="/support"              icon={<RiCustomerService2Line />} label="Support" expand={expand} active={isActive("/support")} />
              <NavItem href="/report"               icon={<RiFlagLine />}             label="Report"  expand={expand} active={isActive("/report")} />
              <NavItem href="/privacy-policy"       icon={<MdOutlinePrivacyTip />}   label="Privacy" expand={expand} active={isActive("/privacy-policy")} />
              <NavItem href="/terms-and-conditions" icon={<MdOutlineDescription />}  label="Terms"   expand={expand} active={isActive("/terms-and-conditions")} />
            </nav>
          </div>
        </div>

      </aside>

    </>
  );
}
