"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getLikedVideos, type BookmarkedVideo } from "@/features/profile/services/profileService";

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-elevated)",
  borderRadius: 14,
  border: "1px solid var(--color-border-secondary)",
  overflow: "hidden",
  cursor: "pointer",
  transition: "transform 0.15s, box-shadow 0.15s",
};

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

interface LikedClientProps {
  userId: string;
}

export function LikedClient({ userId }: LikedClientProps) {
  const router = useRouter();
  const { authUser } = useAuth();
  const isOwner = !!authUser && authUser._id === userId;

  const [videos, setVideos] = useState<BookmarkedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authUser) return;
    if (!isOwner) {
      setLoading(false);
      return;
    }
    getLikedVideos(userId)
      .then(setVideos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId, authUser, isOwner]);

  function goBack() {
    router.push(`/user/${userId}`);
  }

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  };

  const backBtnStyle: React.CSSProperties = {
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
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 16px",
      }}
    >
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={goBack}>
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
          ❤️ Liked Videos
        </h1>
        {!loading && videos.length > 0 && (
          <span
            style={{
              fontSize: 13,
              color: "var(--color-text-tertiary)",
              marginLeft: "auto",
            }}
          >
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!authUser && (
        <EmptyState icon="🔒" label="Sign in to view your liked videos" />
      )}

      {authUser && !isOwner && (
        <EmptyState icon="🔒" label="You can only view your own liked videos" />
      )}

      {authUser && isOwner && loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                ...cardStyle,
                cursor: "default",
              }}
            >
              <div
                style={{
                  aspectRatio: "16/9",
                  backgroundColor: "var(--color-bg-secondary)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div style={{ padding: "12px" }}>
                <div
                  style={{
                    height: 14,
                    width: "70%",
                    borderRadius: 6,
                    backgroundColor: "var(--color-bg-secondary)",
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    height: 12,
                    width: "40%",
                    borderRadius: 6,
                    backgroundColor: "var(--color-bg-secondary)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {authUser && isOwner && !loading && error && (
        <EmptyState icon="⚠️" label={error} />
      )}

      {authUser && isOwner && !loading && !error && videos.length === 0 && (
        <EmptyState icon="❤️" label="No liked videos yet. Like some videos to see them here" />
      )}

      {authUser && isOwner && !loading && !error && videos.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {videos.map((v) => (
            <div
              key={v._id}
              style={cardStyle}
              onClick={() => v.slug && router.push(`/watch/${v.slug}`)}
            >
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16/9",
                  backgroundColor: "var(--color-bg-secondary)",
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
                      fontSize: 36,
                      opacity: 0.3,
                    }}
                  >
                    🎬
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    backgroundColor: "rgba(239,68,68,0.9)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  ❤️ Liked
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v.title ?? "Untitled"}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {v.views != null ? `${v.views.toLocaleString()} views` : ""}
                  {v.views != null && v.createdAt ? " · " : ""}
                  {v.createdAt
                    ? new Date(v.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
