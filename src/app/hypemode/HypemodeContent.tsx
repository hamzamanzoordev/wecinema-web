"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCrown } from "react-icons/fa";
import { MdVerifiedUser } from "react-icons/md";
import { Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/lib/constants";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { Video } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

// ─── Helpers ──────────────────────────────────────────────────

function formatDateAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * True while the user is inside their original 7-day free-trial window and
 * hasn't since taken out a real paid subscription. A real payment always
 * pushes `subscriptionExpiresAt` further out than the fixed `trialEndsAt`
 * mark, so comparing the two distinguishes "still on trial" from "paid".
 */
function isTrialActive(authUser: { trialEndsAt?: string | null; subscriptionExpiresAt?: string | null } | null): boolean {
  if (!authUser?.trialEndsAt || !authUser?.subscriptionExpiresAt) return false;
  const trialEnds = new Date(authUser.trialEndsAt).getTime();
  const subExpires = new Date(authUser.subscriptionExpiresAt).getTime();
  return trialEnds > Date.now() && subExpires <= trialEnds;
}

function trialDaysLeft(trialEndsAt: string): number {
  return Math.max(1, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000));
}

// ─── Skeleton ─────────────────────────────────────────────────

function GallerySkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 20,
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div
            className="animate-pulse"
            style={{
              aspectRatio: "16/9",
              borderRadius: 12,
              backgroundColor: "var(--color-skeleton-base)",
            }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <div
              className="animate-pulse"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "var(--color-skeleton-base)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                className="animate-pulse"
                style={{ height: 13, borderRadius: 6, backgroundColor: "var(--color-skeleton-base)" }}
              />
              <div
                className="animate-pulse"
                style={{
                  height: 11,
                  width: "60%",
                  borderRadius: 6,
                  backgroundColor: "var(--color-skeleton-base)",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────

function EmptyState({ category }: { category?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "var(--color-bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
        }}
      >
        <Play size={20} style={{ color: "var(--color-text-tertiary)" }} />
      </div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          margin: 0,
        }}
      >
        No premium videos found
      </p>
      {category && (
        <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4 }}>
          No paid content in <strong>{category}</strong>
        </p>
      )}
    </div>
  );
}

// ─── Video card ───────────────────────────────────────────────

const FALLBACK_THUMB =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiA5Ij48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iOSIgZmlsbD0iIzI2MjYyNiIvPjwvc3ZnPg==";

function HypemodeVideoCard({ video }: { video: Video }) {
  const href = `/watch/${video.slug ?? video._id}`;
  const thumb = video.thumbnailSmall ?? video.thumbnail ?? FALLBACK_THUMB;
  const author =
    typeof video.author === "object" && video.author !== null ? video.author : null;
  const authorHref = author ? `/user/${author._id}` : null;
  const authorName = author?.username ?? "Unknown";
  const authorAvatar = author?.avatar;

  return (
    <article style={{ display: "flex", flexDirection: "column" }}>
      {/* Thumbnail */}
      <Link
        href={href}
        style={{
          position: "relative",
          display: "block",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "16/9",
          backgroundColor: "var(--color-bg-elevated)",
        }}
        className="group"
      >
        <Image
          src={thumb}
          alt={video.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized={thumb.startsWith("data:")}
        />

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        >
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.92)",
              borderRadius: "50%",
              padding: 10,
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
            }}
          >
            <Play size={16} style={{ color: "#111", fill: "#111" }} />
          </div>
        </div>

        {/* Premium badge */}
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "#F59E0B",
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.06em",
            padding: "3px 8px",
            borderRadius: 9999,
          }}
        >
          PREMIUM
        </span>

        {/* Views pill */}
        <span
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            backgroundColor: "rgba(0,0,0,0.65)",
            color: "#fff",
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 9999,
            backdropFilter: "blur(4px)",
          }}
        >
          {(video.views ?? 0).toLocaleString()} views
        </span>
      </Link>

      {/* Meta */}
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "flex-start" }}>
        {authorHref ? (
          <Link href={authorHref} style={{ flexShrink: 0 }}>
            <Avatar src={authorAvatar} username={authorName} size={32} />
          </Link>
        ) : (
          <Avatar src={null} username={authorName} size={32} />
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          <Link href={href} style={{ textDecoration: "none" }}>
            <h3
              className="line-clamp-2"
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.35,
                color: "var(--color-text-primary)",
              }}
            >
              {video.title}
            </h3>
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 3,
              flexWrap: "wrap",
            }}
          >
            {authorHref ? (
              <Link
                href={authorHref}
                style={{
                  fontSize: 11,
                  color: "var(--color-text-tertiary)",
                  textDecoration: "none",
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {authorName}
              </Link>
            ) : (
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                {authorName}
              </span>
            )}
            <MdVerifiedUser size={10} color="#22C55E" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              · {formatDateAgo(video.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main ─────────────────────────────────────────────────────

interface HypemodeContentProps {
  videos: Video[];
  appUrl: string;
}

export function HypemodeContent({ videos, appUrl: _appUrl }: HypemodeContentProps) {
  const { authUser, isLoading } = useAuth();
  const hasPaid = authUser?.hasPaid ?? false;
  const onTrial = isTrialActive(authUser);
  const [genre, setGenre] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filtered = useMemo(() => {
    if (!genre) return videos;
    return videos.filter((v) => {
      const genres = Array.isArray(v.genre) ? v.genre : v.genre ? [v.genre] : [];
      return genres.some((g) => g.toLowerCase() === genre.toLowerCase());
    });
  }, [videos, genre]);

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-tertiary)",
        color: "var(--color-text-primary)",
        minHeight: "100vh",
      }}
    >
      {/* ── Hero ── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "64px 24px 48px",
          textAlign: "center",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(245,158,11,0.35)",
            }}
          >
            <FaCrown size={28} color="#fff" />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 6vw, 3rem)",
              fontWeight: 900,
              fontFamily: "var(--font-heading)",
              color: "var(--color-text-primary)",
            }}
          >
            Hype<span style={{ color: "#F59E0B" }}>Mode</span>
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              color: "var(--color-text-secondary)",
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Exclusive premium content from the best creators on WeCinema
          </p>

          {/* Show auth CTAs after hydration + auth settled */}
          {mounted && !isLoading && !hasPaid && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <Link
                href="/login?redirect=%2Fexplore"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                  padding: "10px 24px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
                  textDecoration: "none",
                }}
              >
                <FaCrown size={13} /> Sign In to Access Premium
              </Link>
              <Link
                href="/signup?redirect=%2Fexplore"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                  padding: "10px 24px",
                  borderRadius: 14,
                  background: "transparent",
                  color: "#F59E0B",
                  fontWeight: 600,
                  fontSize: 14,
                  border: "1.5px solid rgba(245,158,11,0.5)",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Join Free
              </Link>
            </div>
          )}

          {mounted && !isLoading && onTrial && authUser?.trialEndsAt && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginTop: 8,
                padding: "8px 18px",
                borderRadius: 14,
                background: "rgba(245,158,11,0.1)",
                border: "1.5px solid rgba(245,158,11,0.4)",
                color: "#F59E0B",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <FaCrown size={12} />
              Free trial: {trialDaysLeft(authUser.trialEndsAt)} day{trialDaysLeft(authUser.trialEndsAt) !== 1 ? "s" : ""} left
              <Link href="/pricing" style={{ color: "#F59E0B", textDecoration: "underline", fontWeight: 700 }}>
                Manage
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Genre filter ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 8px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(["", ...CATEGORIES] as string[]).map((cat) => {
            const active = genre === cat;
            return (
              <button
                key={cat || "all"}
                type="button"
                onClick={() => setGenre(active && cat !== "" ? "" : cat)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "1px solid",
                  borderColor: active
                    ? "rgba(245,158,11,0.45)"
                    : "var(--color-border-secondary)",
                  backgroundColor: active
                    ? "rgba(245,158,11,0.12)"
                    : "var(--color-bg-elevated)",
                  color: active ? "#F59E0B" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {cat || "All"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Gallery ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px 56px" }}>
        {!mounted ? (
          <GallerySkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState category={genre || undefined} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {filtered.map((video) => (
              <HypemodeVideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
