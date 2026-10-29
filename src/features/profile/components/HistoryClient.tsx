"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getWatchHistory, type HistoryEntry } from "@/features/profile/services/profileService";

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 20px",
        color: "var(--color-text-tertiary)",
      }}
    >
      <p style={{ fontSize: 48, margin: "0 0 12px" }}>{icon}</p>
      <p style={{ margin: 0, fontSize: 15 }}>{label}</p>
    </div>
  );
}

function formatWatchedAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(entries: HistoryEntry[]): [string, HistoryEntry[]][] {
  const groups: Record<string, HistoryEntry[]> = {};
  for (const entry of entries) {
    const key = new Date(entry.watchedAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return Object.entries(groups);
}

interface HistoryClientProps {
  userId: string;
}

export function HistoryClient({ userId }: HistoryClientProps) {
  const router = useRouter();
  const { authUser } = useAuth();
  const isOwner = !!authUser && authUser._id === userId;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authUser || !isOwner) {
      setLoading(false);
      return;
    }
    getWatchHistory(userId)
      .then(setHistory)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId, authUser, isOwner]);

  const grouped = groupByDate(history);

  const cardStyle: React.CSSProperties = {
    display: "flex",
    gap: 14,
    padding: "12px",
    borderRadius: 12,
    backgroundColor: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border-secondary)",
    cursor: "pointer",
    transition: "background-color 0.15s",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            border: "1px solid var(--color-border-secondary)",
            backgroundColor: "transparent",
            color: "var(--color-text-secondary)",
            fontSize: 13,
            cursor: "pointer",
          }}
          onClick={() => router.push(`/user/${userId}`)}
        >
          ← Back
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          📜 Watch History
        </h1>
        {!loading && history.length > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 13,
              color: "var(--color-text-tertiary)",
            }}
          >
            {history.length} watched
          </span>
        )}
      </div>

      {!authUser && <EmptyState icon="🔒" label="Sign in to view your watch history" />}
      {authUser && !isOwner && <EmptyState icon="🔒" label="You can only view your own watch history" />}

      {authUser && isOwner && loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-secondary)",
              }}
            >
              <div
                style={{
                  width: 140,
                  aspectRatio: "16/9",
                  borderRadius: 8,
                  backgroundColor: "var(--color-bg-secondary)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 14,
                    width: "60%",
                    borderRadius: 6,
                    backgroundColor: "var(--color-bg-secondary)",
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    height: 12,
                    width: "35%",
                    borderRadius: 6,
                    backgroundColor: "var(--color-bg-secondary)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {authUser && isOwner && !loading && error && <EmptyState icon="⚠️" label={error} />}

      {authUser && isOwner && !loading && !error && history.length === 0 && (
        <EmptyState icon="📜" label="No watch history yet. Start watching videos!" />
      )}

      {authUser && isOwner && !loading && !error && history.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {grouped.map(([dateLabel, entries]) => (
            <div key={dateLabel}>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {dateLabel}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.map((entry) => {
                  const v = entry.videoId;
                  if (!v?._id) return null;
                  return (
                    <div
                      key={entry._id}
                      style={cardStyle}
                      onClick={() => v.slug && router.push(`/watch/${v.slug}`)}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: 140,
                          aspectRatio: "16/9",
                          borderRadius: 8,
                          overflow: "hidden",
                          backgroundColor: "var(--color-bg-secondary)",
                          flexShrink: 0,
                        }}
                      >
                        {v.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.thumbnail}
                            alt={v.title ?? "Video"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 28,
                              opacity: 0.3,
                            }}
                          >
                            🎬
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--color-text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.title ?? "Untitled"}
                        </p>
                        {v.description && (
                          <p
                            style={{
                              margin: "0 0 8px",
                              fontSize: 12,
                              color: "var(--color-text-secondary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {v.description}
                          </p>
                        )}
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          {v.views != null ? `${v.views.toLocaleString()} views · ` : ""}
                          Watched {formatWatchedAt(entry.watchedAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
