"use client";

import {
  useState, useRef, useEffect, useCallback, memo,
  type FC,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { MdMenu } from "react-icons/md";
import { Search, X, Sun, Moon, ChevronDown, LogOut, User, Settings, Upload, FileText } from "lucide-react";
import { CATEGORIES, RATINGS, RATING_META } from "@/lib/constants";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AvatarProgress } from "@/components/ui/AvatarProgress";
import { useUploads } from "@/features/upload/context/UploadManagerProvider";
import { UploadsMenuSection } from "@/features/upload/components/UploadsMenu";
import SearchBar from "@/features/search/SearchBar";
import { WitchHat, Pumpkin } from "@/components/layout/HalloweenDecor";

interface HeaderProps {
  toggleSidebar?: () => void;
}

const NAV_LINKS = [
  { label: "Home",        href: "/",            exact: true  },
  { label: "Marketplace", href: "/marketplace", exact: false },
  { label: "Blog",        href: "/blog",        exact: false },
];

const STYLES = `
  @keyframes hdrFade   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hdrFadeUp { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes hdrExpand { from{opacity:0;transform:scaleX(0.96);transform-origin:right center} to{opacity:1;transform:scaleX(1)} }

  .hdr-nav-link { position:relative; font-size:0.875rem; font-weight:500; padding:4px 0; text-decoration:none; white-space:nowrap; transition:color 0.15s; color:var(--color-text-secondary); }
  .hdr-nav-link::after { content:''; position:absolute; bottom:-4px; left:0; right:0; height:2px; border-radius:9999px; background:var(--color-accent-primary); transform:scaleX(0); transform-origin:center; transition:transform 0.2s cubic-bezier(0.16,1,0.3,1); }
  .hdr-nav-link:hover { color:var(--color-text-primary); }
  .hdr-nav-link.active { color:var(--color-text-primary); }
  .hdr-nav-link.active::after { transform:scaleX(1); }

  .hdr-dd-trigger { display:inline-flex; align-items:center; gap:4px; font-size:0.875rem; font-weight:500; white-space:nowrap; border:none; background:transparent; cursor:pointer; padding:4px 0; color:var(--color-text-secondary); font-family:inherit; transition:color 0.15s; position:relative; }
  .hdr-dd-trigger::after { content:''; position:absolute; bottom:-4px; left:0; right:0; height:2px; border-radius:9999px; background:var(--color-accent-primary); transform:scaleX(0); transform-origin:center; transition:transform 0.2s cubic-bezier(0.16,1,0.3,1); }
  .hdr-dd-trigger:hover { color:var(--color-text-primary); }
  .hdr-dd-trigger.open  { color:var(--color-text-primary); }
  .hdr-dd-trigger.open::after { transform:scaleX(1); }

  .hdr-mob-pill { display:inline-flex; align-items:center; gap:5px; padding:0 14px; height:34px; border-radius:9999px; border:1px solid var(--color-border-secondary); background:var(--color-bg-elevated); color:var(--color-text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; transition:all 0.15s; }
  .hdr-mob-pill:hover, .hdr-mob-pill.open { border-color:var(--color-accent-primary); color:var(--color-accent-primary); background:rgba(255,187,0,0.06); }

  .hdr-icon { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:10px; border:none; background:transparent; color:var(--color-text-secondary); cursor:pointer; transition:background-color 0.15s,color 0.15s; }
  .hdr-icon:hover { background-color:var(--color-bg-tertiary); color:var(--color-text-primary); }

  .hdr-drop { position:absolute; top:calc(100% + 12px); background:var(--color-bg-elevated); border:1px solid var(--color-border-secondary); border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.13); overflow:hidden; z-index:200; animation:hdrFade 0.18s cubic-bezier(0.16,1,0.3,1) forwards; }
  .hdr-row { display:flex; align-items:center; gap:10px; width:100%; padding:10px 14px; border:none; background:transparent; color:var(--color-text-primary); font-size:0.8125rem; font-weight:500; cursor:pointer; text-align:left; transition:background-color 0.12s; font-family:inherit; text-decoration:none; }
  .hdr-row:hover { background-color:var(--color-bg-tertiary); }
  .hdr-user-btn { border-color:var(--color-border-secondary) !important; }
  .hdr-user-btn:hover, .hdr-user-btn.open { border-color:var(--color-accent-primary) !important; }

  /* Responsive chrome — CSS-only (no JS innerWidth check). A JS-driven
     screenW state defaults to desktop on first render and only corrects
     itself once an effect/resize event fires, so mobile would briefly (or
     until a scroll-triggered resize) show desktop nav links instead of the
     mobile pills. CSS media queries are correct on the very first paint. */
  .hdr-logo-text { display:none; }
  @media (min-width:901px) { .hdr-logo-text { display:inline; } }

  .hdr-nav-links { display:none; }
  @media (min-width:881px) { .hdr-nav-links { display:flex; } }

  .hdr-mobile-pills { display:flex; }
  @media (max-width:480px), (min-width:881px) { .hdr-mobile-pills { display:none; } }

  /* Same breakpoint as .hdr-nav-links / .hdr-mobile-pills so one of the two
     Genre/Rating controls is always visible — a phone in "Desktop site" mode
     lands at ~980px, which used to fall in a gap where neither showed. */
  .hdr-filters { display:none; }
  @media (min-width:881px) { .hdr-filters { display:flex; } }

  .hdr-username { display:none; }
  @media (min-width:501px) { .hdr-username { display:inline; } }

  .hdr-signin { display:none; }
  @media (min-width:401px) { .hdr-signin { display:inline-flex; } }

  .hdr-logo { display:flex; }
  .hdr-spacer { flex:1; }
  .hdr-search-wrap { flex:0 1 400px; min-width:0; }
  @media (max-width:768px) {
    header.hdr-search-open .hdr-logo { display:none; }
    header.hdr-search-open .hdr-spacer { flex:0; }
    header.hdr-search-open .hdr-search-wrap { flex:1; }
  }
`;

const Chevron = ({ open, size = 13 }: { open: boolean; size?: number }) => (
  <ChevronDown size={size} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
);

const GenreDropdown = memo<{ open: boolean; onSelect: (g: string) => void }>(({ open, onSelect }) => {
  if (!open) return null;
  return (
    <div className="hdr-drop" style={{ left: 0, minWidth: 190 }}>
      <div style={{ padding: "8px 14px 6px", borderBottom: "1px solid var(--color-divider)" }}>
        <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.09em" }}>Genres</p>
      </div>
      <div style={{ padding: 4, maxHeight: 300, overflowY: "auto" }}>
        {CATEGORIES.map((g) => (
          <button key={g} className="hdr-row" onClick={() => onSelect(g)}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--color-accent-primary)", flexShrink: 0 }} />
            {g}
          </button>
        ))}
      </div>
    </div>
  );
});
GenreDropdown.displayName = "GenreDropdown";

const RatingDropdown = memo<{ open: boolean; onSelect: (r: string) => void }>(({ open, onSelect }) => {
  if (!open) return null;
  return (
    <div className="hdr-drop" style={{ left: 0, minWidth: 210 }}>
      <div style={{ padding: "8px 14px 6px", borderBottom: "1px solid var(--color-divider)" }}>
        <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.09em" }}>Ratings</p>
      </div>
      <div style={{ padding: 8 }}>
        {RATINGS.map((r) => {
          const meta = RATING_META[r] ?? { label: r, color: "#909090" };
          return (
            <button
              key={r} onClick={() => onSelect(r)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", marginBottom: 4, borderRadius: 10, border: "none", background: "var(--color-bg-tertiary)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background-color 0.12s" }}
            >
              <span style={{ fontSize: "0.6875rem", fontWeight: 800, padding: "3px 8px", borderRadius: 5, background: meta.color, color: "#fff", flexShrink: 0 }}>{r}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
RatingDropdown.displayName = "RatingDropdown";

const Header: FC<HeaderProps> = ({ toggleSidebar }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const { authUser, isAuthenticated, isLoading, logout } = useAuth();
  const { jobs: uploadJobs, totalProgress, ringState } = useUploads();

  const [searchOpen, setSearchOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const genreRef = useRef<HTMLDivElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);
  const genreMobRef = useRef<HTMLDivElement>(null);
  const ratingMobRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!genreRef.current?.contains(t) && !genreMobRef.current?.contains(t)) setGenreOpen(false);
      if (!ratingRef.current?.contains(t) && !ratingMobRef.current?.contains(t)) setRatingOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(t)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const closeSearch = useCallback(() => { setSearchOpen(false); }, []);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleGenreSelect = useCallback((g: string) => { setGenreOpen(false); router.push(`/category/${g.toLowerCase()}`); }, [router]);
  const handleRatingSelect = useCallback((r: string) => { setRatingOpen(false); router.push(`/ratings/${r}`); }, [router]);

  return (
    <>
      <style>{STYLES}</style>
      <header className={searchOpen ? "hdr-search-open" : ""} style={{
        position: "sticky", top: 0, zIndex: 100, width: "100%",
        backgroundColor: "var(--color-nav-bg)",
        borderBottom: `1px solid ${(scrolled || genreOpen || ratingOpen) ? "var(--color-divider)" : "transparent"}`,
        boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.07)" : "none",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, height: 60, maxWidth: 1536, margin: "0 auto", padding: "0 16px" }}>

          <button className="hdr-icon" onClick={toggleSidebar} aria-label="Menu">
            <MdMenu size={22} />
          </button>

          <Link href="/" aria-label="Home" className="hdr-logo" style={{ alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none", marginLeft: 2, flexShrink: 0, textDecoration: "none" }}>
            <span className="hw-logo-mark">
              <Image src="/wecinema.webp" alt="WeCinema" width={32} height={28} priority style={{ objectFit: "contain" }} />
              <WitchHat />
            </span>
            <span className="hdr-logo-text" style={{ fontSize: "1.0625rem", fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
              WeCinema
            </span>
            <Pumpkin size={16} />
          </Link>

          <nav className="hdr-nav-links" style={{ alignItems: "center", gap: 22, marginLeft: 18, flexShrink: 0 }}>
            {NAV_LINKS.map(({ label, href, exact }) => (
              <Link key={href} href={href} className={`hdr-nav-link ${isActive(href, exact) ? "active" : ""}`}>
                {label}
              </Link>
            ))}

            <div className="hdr-filters" style={{ alignItems: "center", gap: 22 }}>
              <div style={{ position: "relative" }} ref={genreRef}>
                <button className={`hdr-dd-trigger ${genreOpen ? "open" : ""}`} onClick={() => { setGenreOpen((p) => !p); setRatingOpen(false); }} aria-expanded={genreOpen}>
                  Genre <Chevron open={genreOpen} />
                </button>
                <GenreDropdown open={genreOpen} onSelect={handleGenreSelect} />
              </div>

              <div style={{ position: "relative" }} ref={ratingRef}>
                <button className={`hdr-dd-trigger ${ratingOpen ? "open" : ""}`} onClick={() => { setRatingOpen((p) => !p); setGenreOpen(false); }} aria-expanded={ratingOpen}>
                  Rating <Chevron open={ratingOpen} />
                </button>
                <RatingDropdown open={ratingOpen} onSelect={handleRatingSelect} />
              </div>
            </div>
          </nav>

          {!searchOpen && (
            <div className="hdr-mobile-pills" style={{ alignItems: "center", gap: 6, marginLeft: 8, flexShrink: 0 }}>
              <div style={{ position: "relative" }} ref={genreMobRef}>
                <button className={`hdr-mob-pill ${genreOpen ? "open" : ""}`} onClick={() => { setGenreOpen((p) => !p); setRatingOpen(false); }} aria-expanded={genreOpen}>
                  Genre <Chevron open={genreOpen} size={12} />
                </button>
                <GenreDropdown open={genreOpen} onSelect={handleGenreSelect} />
              </div>
              <div style={{ position: "relative" }} ref={ratingMobRef}>
                <button className={`hdr-mob-pill ${ratingOpen ? "open" : ""}`} onClick={() => { setRatingOpen((p) => !p); setGenreOpen(false); }} aria-expanded={ratingOpen}>
                  Rating <Chevron open={ratingOpen} size={12} />
                </button>
                <RatingDropdown open={ratingOpen} onSelect={handleRatingSelect} />
              </div>
            </div>
          )}

          <div className="hdr-spacer" />

          {searchOpen ? (
            <div className="hdr-search-wrap" style={{ display: "flex", alignItems: "center", gap: 8, animation: "hdrExpand 0.2s ease-out" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SearchBar onClose={closeSearch} autoFocus />
              </div>
              <button className="hdr-icon" onClick={closeSearch} aria-label="Close search">
                <X size={18} />
              </button>
            </div>
          ) : (
            <button className="hdr-icon" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={20} />
            </button>
          )}

          {!searchOpen && (
            <button className="hdr-icon" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {!searchOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isLoading ? (
                // Match the resolved auth button's height (40px) so the swap
                // doesn't shift the header (reduces CLS).
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-skeleton-base)", flexShrink: 0 }} />
              ) : isAuthenticated && authUser ? (
                <div ref={userMenuRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setUserMenuOpen((p) => !p)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px 0 4px", height: 40, borderRadius: 9999, border: "1.5px solid var(--color-border-secondary)", background: "var(--color-bg-elevated)", cursor: "pointer", transition: "border-color 0.15s" }}
                    className={userMenuOpen ? "hdr-user-btn open" : "hdr-user-btn"}
                    aria-label="User menu"
                  >
                    <AvatarProgress
                      src={authUser.avatar}
                      username={authUser.username}
                      size={30}
                      progress={totalProgress}
                      state={ringState}
                    />
                    <span className="hdr-username" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {authUser.username}
                    </span>
                    <Chevron open={userMenuOpen} size={13} />
                  </button>

                  {userMenuOpen && (
                    <div className="hdr-drop" style={{ right: 0, minWidth: uploadJobs.length ? 320 : 200, maxWidth: "calc(100vw - 24px)" }}>
                      <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--color-divider)" }}>
                        <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser.username}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser.email}</p>
                      </div>
                      <UploadsMenuSection onNavigate={() => setUserMenuOpen(false)} />
                      <div style={{ padding: 4 }}>
                        <Link href={`/user/${authUser._id}`} className="hdr-row" onClick={() => setUserMenuOpen(false)}>
                          <User size={15} style={{ flexShrink: 0 }} />
                          Profile
                        </Link>
                        <Link href="/settings" className="hdr-row" onClick={() => setUserMenuOpen(false)}>
                          <Settings size={15} style={{ flexShrink: 0 }} />
                          Settings
                        </Link>
                      </div>
                      <div style={{ height: 1, background: "var(--color-divider)", margin: "0 4px" }} />
                      <div style={{ padding: "4px 4px 2px", paddingTop: 2 }}>
                        <p style={{ margin: "6px 0 4px 10px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--color-text-tertiary)" }}>Create</p>
                        <Link href="/upload/video" className="hdr-row" onClick={() => setUserMenuOpen(false)}>
                          <Upload size={15} style={{ flexShrink: 0, color: "var(--color-accent-primary)" }} />
                          Upload Video
                        </Link>
                        <Link href="/upload/script" className="hdr-row" onClick={() => setUserMenuOpen(false)}>
                          <FileText size={15} style={{ flexShrink: 0, color: "var(--color-accent-primary)" }} />
                          Upload Script
                        </Link>
                      </div>
                      <div style={{ height: 1, background: "var(--color-divider)", margin: "0 4px" }} />
                      <div style={{ padding: 4 }}>
                        <button
                          className="hdr-row"
                          onClick={async () => { setUserMenuOpen(false); await logout(); router.push("/"); }}
                          style={{ width: "100%", color: "#EF4444" }}
                        >
                          <LogOut size={15} style={{ flexShrink: 0 }} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" className="hdr-signin" style={{ height: 36, padding: "0 16px", borderRadius: 9999, border: "1.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-secondary)", fontSize: "0.8125rem", fontWeight: 600, whiteSpace: "nowrap", alignItems: "center", textDecoration: "none" }}>
                    Sign In
                  </Link>
                  <Link href="/signup" style={{ height: 36, padding: "0 16px", borderRadius: 9999, border: "none", background: "var(--color-accent-primary)", color: "#fff", fontSize: "0.8125rem", fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 2px 12px rgba(255,187,0,0.28)", display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default memo(Header);
