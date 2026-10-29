"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { uploadDirectToS3 } from "@/features/upload/services/presignedUpload";
import { ThumbnailPicker } from "@/features/upload/components/ThumbnailPicker";
import { DraftsGrid } from "@/features/upload/components/DraftCards";
import { listDrafts, type VideoDraft } from "@/features/upload/api/drafts";
import {
  getUserById,
  editProfile,
  changeUserType,
  checkUsernameAvailable,
  getVideosByAuthor,
  deleteVideo,
  editVideo,
  getScriptsByAuthor,
  deleteScript,
  getVideoBookmarks,
  addVideoBookmark,
  removeVideoBookmark,
  getScriptBookmarks,
  addScriptBookmark,
  removeScriptBookmark,
  getSubscriptionHistory,
  type ProfileVideo,
  type ProfileScript,
} from "@/features/profile/services/profileService";
import type {
  FullUser,
  ProfileTag,
  UserType,
  SubscriptionHistoryEntry,
} from "@/types";
import { MAX_PROFILE_TAGS } from "@/types";

// ─── Constants ────────────────────────────────────────────────

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5173";

type TagStyle = {
  bg: string;
  text: string;
  border: string;
  icon: string;
};

const TAG_STYLES: Record<ProfileTag, TagStyle> = {
  Actor: {
    bg: "rgba(239,68,68,0.10)",
    text: "#ef4444",
    border: "rgba(239,68,68,0.25)",
    icon: "🎭",
  },
  Studio: {
    bg: "rgba(139,92,246,0.10)",
    text: "#8b5cf6",
    border: "rgba(139,92,246,0.25)",
    icon: "🎬",
  },
  Filmmaker: {
    bg: "rgba(14,165,233,0.10)",
    text: "#0ea5e9",
    border: "rgba(14,165,233,0.25)",
    icon: "🎥",
  },
  Writer: {
    bg: "rgba(245,158,11,0.10)",
    text: "#f59e0b",
    border: "rgba(245,158,11,0.25)",
    icon: "✍️",
  },
  "AI Creator": {
    bg: "rgba(16,185,129,0.10)",
    text: "#10b981",
    border: "rgba(16,185,129,0.25)",
    icon: "🤖",
  },
  User: {
    bg: "rgba(107,114,128,0.10)",
    text: "#6b7280",
    border: "rgba(107,114,128,0.25)",
    icon: "👤",
  },
};

const ALL_TAGS: ProfileTag[] = [
  "Actor",
  "Studio",
  "Filmmaker",
  "Writer",
  "AI Creator",
  "User",
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Video edit modal ─────────────────────────────────────────

interface VideoEditModalProps {
  video: ProfileVideo;
  onClose: () => void;
  onSaved: (updated: ProfileVideo) => void;
}

function VideoEditModal({ video, onClose, onSaved }: VideoEditModalProps) {
  const [title, setTitle] = useState(video.title ?? "");
  const [description, setDescription] = useState(video.description ?? "");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const thumbnailKey = thumbFile
        ? (await uploadDirectToS3("thumbnail", thumbFile)).key
        : undefined;
      const res = await editVideo(video._id, {
        title,
        description,
        ...(thumbnailKey ? { thumbnailKey } : {}),
      });
      onSaved({
        ...video,
        title,
        description,
        ...(thumbnailKey && res?.video
          ? { thumbnail: res.video.thumbnail, thumbnailSmall: res.video.thumbnailSmall }
          : {}),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          borderRadius: 16,
          padding: "28px 24px",
          width: "100%",
          maxWidth: 640,
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          border: "1px solid var(--color-border-secondary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 18px",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          Edit Video
        </h3>
        <label style={labelStyle}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
        <label style={{ ...labelStyle, marginTop: 12 }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <label style={{ ...labelStyle, marginTop: 12 }}>Thumbnail</label>
        <ThumbnailPicker
          videoSrc={video.file}
          currentUrl={video.thumbnail}
          value={thumbFile}
          onChange={setThumbFile}
        />
        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, margin: "8px 0 0" }}>
            {error}
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={saveBtnStyle}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared style objects ─────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--color-border-secondary)",
  backgroundColor: "var(--color-bg-secondary)",
  color: "var(--color-text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "9px 22px",
  borderRadius: 10,
  border: "none",
  backgroundColor: "var(--color-accent-primary)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "9px 18px",
  borderRadius: 10,
  border: "1px solid var(--color-border-secondary)",
  backgroundColor: "transparent",
  color: "var(--color-text-secondary)",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

// ─── Main component ───────────────────────────────────────────

interface UserProfileClientProps {
  userId: string;
}

export function UserProfileClient({ userId }: UserProfileClientProps) {
  const params = useParams();
  const id = userId || (typeof params.id === "string" ? params.id : "");

  const router = useRouter();
  const { authUser, refreshUser } = useAuth();
  const isOwner = !!authUser && authUser._id === id;

  // ── State ──────────────────────────────────────────────────
  const [user, setUser] = useState<FullUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");

  const [scripts, setScripts] = useState<ProfileScript[]>([]);
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [subHistory, setSubHistory] = useState<SubscriptionHistoryEntry[]>([]);

  const [videoBM, setVideoBM] = useState<Set<string>>(new Set());
  const [scriptBM, setScriptBM] = useState<Set<string>>(new Set());
  const [bmPending, setBmPending] = useState<Set<string>>(new Set());

  const [marketplaceMode, setMarketplaceMode] = useState<UserType>("buyer");
  const [changingMode, setChangingMode] = useState(false);

  const [editingVideo, setEditingVideo] = useState<ProfileVideo | null>(null);

  // Owner-only: the Videos tab can switch to unpublished drafts.
  const [videoView, setVideoView] = useState<"published" | "drafts">("published");
  const [drafts, setDrafts] = useState<VideoDraft[] | null>(null);

  useEffect(() => {
    if (!isOwner || videoView !== "drafts" || drafts) return;
    listDrafts().then(setDrafts).catch(() => setDrafts([]));
  }, [isOwner, videoView, drafts]);

  const [formData, setFormData] = useState({
    username: "",
    dob: "",
    bio: "",
    profileTags: [] as ProfileTag[],
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Live username-availability state for the edit form.
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const [usernameMsg, setUsernameMsg] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Load user ──────────────────────────────────────────────
  const loadUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const u = await getUserById(id);
      setUser(u);
      setMarketplaceMode(u.userType === "seller" ? "seller" : "buyer");
      setFormData({
        username: u.username,
        dob: u.dob ? (u.dob.split("T")[0] ?? "") : "",
        bio: u.bio ?? "",
        profileTags: u.profileTags ?? [],
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // For the owner, the auth user is the source of truth, so switches made elsewhere
  // (e.g. the sidebar) show up here too.
  const authUserType = authUser?.userType;
  const activeMode: UserType =
    isOwner && (authUserType === "buyer" || authUserType === "seller") ? authUserType : marketplaceMode;

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ── Live username availability (debounced) ─────────────────
  useEffect(() => {
    if (!editMode) return;
    const candidate = formData.username.trim();
    const current = (user?.username ?? "").trim();

    // Unchanged or same as current → nothing to flag.
    if (candidate.toLowerCase() === current.toLowerCase()) {
      setUsernameStatus("idle");
      setUsernameMsg("");
      return;
    }
    if (candidate.length < 2 || candidate.length > 30) {
      setUsernameStatus("unavailable");
      setUsernameMsg("Username must be between 2 and 30 characters");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMsg("");
    let cancelled = false;
    const t = setTimeout(() => {
      checkUsernameAvailable(candidate, id)
        .then((r) => {
          if (cancelled) return;
          setUsernameStatus(r.available ? "available" : "unavailable");
          setUsernameMsg(
            r.available ? "Username is available" : (r.reason ?? "Username is already taken"),
          );
        })
        .catch(() => {
          if (cancelled) return;
          // Don't block saving on a check failure; backend re-validates.
          setUsernameStatus("idle");
          setUsernameMsg("");
        });
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [formData.username, editMode, user?.username, id]);

  // ── Load tab content ───────────────────────────────────────
  useEffect(() => {
    if (!id || loading) return;

    if (activeTab === "videos" && videos.length === 0) {
      getVideosByAuthor(id)
        .then(setVideos)
        .catch(() => {});
    }

    if (activeTab === "scripts" && scripts.length === 0) {
      getScriptsByAuthor(id)
        .then(setScripts)
        .catch(() => {});
    }

    if (activeTab === "subscriptions" && isOwner && subHistory.length === 0) {
      getSubscriptionHistory(id)
        .then((r) => setSubHistory(r.history))
        .catch(() => {});
    }
  }, [activeTab, id, loading, isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load bookmarks ─────────────────────────────────────────
  useEffect(() => {
    if (!authUser || !id) return;
    getVideoBookmarks(authUser._id)
      .then((r) => setVideoBM(new Set(r.bookmarks.map((b) => b._id))))
      .catch(() => {});
    getScriptBookmarks(authUser._id)
      .then((r) => setScriptBM(new Set(r.bookmarks.map((b) => b._id))))
      .catch(() => {});
  }, [authUser, id]);

  // ── Refresh ────────────────────────────────────────────────
  async function handleRefresh() {
    setRefreshing(true);
    await loadUser();
    setRefreshing(false);
  }

  // ── Share profile ──────────────────────────────────────────
  // Uses the native share sheet on supporting devices; otherwise copies the
  // profile link to the clipboard and flashes a "Copied" confirmation.
  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/user/${id}`;
    const shareData = {
      title: user ? `${user.username} on WeCinema` : "WeCinema profile",
      text: user ? `Check out ${user.username}'s channel on WeCinema` : undefined,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // user cancelled the native sheet, or it failed — fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard blocked — last resort: prompt so the user can copy manually.
      window.prompt("Copy this profile link:", url);
    }
  }

  // ── Marketplace mode toggle ────────────────────────────────
  async function handleModeToggle() {
    if (!user || changingMode) return;
    const next: UserType = activeMode === "buyer" ? "seller" : "buyer";
    setChangingMode(true);
    try {
      await changeUserType(id, next);
      setMarketplaceMode(next);
      setUser((prev) => (prev ? { ...prev, userType: next } : prev));
      // Sidebar, marketplace tabs and the cached session all read the auth user.
      await refreshUser();
    } catch {
      // revert silently
    } finally {
      setChangingMode(false);
    }
  }

  // ── Bookmark toggles ───────────────────────────────────────
  async function toggleVideoBM(videoId: string) {
    if (bmPending.has(videoId)) return;
    setBmPending((p) => new Set(p).add(videoId));
    const had = videoBM.has(videoId);
    setVideoBM((prev) => {
      const n = new Set(prev);
      had ? n.delete(videoId) : n.add(videoId);
      return n;
    });
    try {
      had ? await removeVideoBookmark(videoId) : await addVideoBookmark(videoId);
    } catch {
      // revert
      setVideoBM((prev) => {
        const n = new Set(prev);
        had ? n.add(videoId) : n.delete(videoId);
        return n;
      });
    } finally {
      setBmPending((p) => {
        const n = new Set(p);
        n.delete(videoId);
        return n;
      });
    }
  }

  async function toggleScriptBM(scriptId: string) {
    if (bmPending.has(scriptId)) return;
    setBmPending((p) => new Set(p).add(scriptId));
    const had = scriptBM.has(scriptId);
    setScriptBM((prev) => {
      const n = new Set(prev);
      had ? n.delete(scriptId) : n.add(scriptId);
      return n;
    });
    try {
      had
        ? await removeScriptBookmark(scriptId)
        : await addScriptBookmark(scriptId);
    } catch {
      setScriptBM((prev) => {
        const n = new Set(prev);
        had ? n.add(scriptId) : n.delete(scriptId);
        return n;
      });
    } finally {
      setBmPending((p) => {
        const n = new Set(p);
        n.delete(scriptId);
        return n;
      });
    }
  }

  // ── Delete handlers ────────────────────────────────────────
  async function handleDeleteVideo(videoId: string) {
    if (!confirm("Delete this video permanently?")) return;
    try {
      await deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleDeleteScript(scriptId: string) {
    if (!confirm("Delete this script permanently?")) return;
    try {
      await deleteScript(scriptId);
      setScripts((prev) => prev.filter((s) => s._id !== scriptId));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  // ── File pickers ───────────────────────────────────────────
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  }

  // ── Save profile ───────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const payload: Record<string, unknown> = {
        username: formData.username,
        bio: formData.bio,
        profileTags: formData.profileTags,
      };
      if (formData.dob) payload.dob = formData.dob;

      if (avatarFile) {
        const { key } = await uploadDirectToS3("avatar", avatarFile);
        payload.avatarKey = key;
      }
      if (coverFile) {
        const { key } = await uploadDirectToS3("cover", coverFile);
        payload.coverImageKey = key;
      }

      const { user: updated } = await editProfile(id, payload);
      setUser(updated);
      setEditMode(false);
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarPreview(null);
      setCoverPreview(null);
      await refreshUser();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleTagToggle(tag: ProfileTag) {
    setFormData((prev) => {
      const has = prev.profileTags.includes(tag);
      if (has) {
        return { ...prev, profileTags: prev.profileTags.filter((t) => t !== tag) };
      }
      if (prev.profileTags.length >= MAX_PROFILE_TAGS) return prev;
      return { ...prev, profileTags: [...prev.profileTags, tag] };
    });
  }

  // ── Tab configuration ──────────────────────────────────────
  type TabDef = { id: string; label: string; route?: string };

  const ownerTabs: TabDef[] = [
    { id: "scripts", label: "📝 Scripts" },
    { id: "videos", label: "🎬 Videos" },
    { id: "liked", label: "❤️ Liked", route: `/user/${id}/liked` },
    { id: "bookmarks", label: "🔖 Bookmarks", route: `/user/${id}/bookmarks` },
    { id: "history", label: "📜 History", route: `/user/${id}/history` },
    { id: "subscriptions", label: "💳 Subscriptions" },
    { id: "about", label: "👤 About" },
  ];

  const visitorTabs: TabDef[] = [
    { id: "scripts", label: "📝 Scripts" },
    { id: "videos", label: "🎬 Videos" },
    { id: "about", label: "👤 About" },
  ];

  const tabs: TabDef[] = isOwner ? ownerTabs : visitorTabs;

  // ── Render helpers ─────────────────────────────────────────

  function renderTagBadge(tag: ProfileTag) {
    const s = TAG_STYLES[tag];
    return (
      <span
        key={tag}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: s.bg,
          color: s.text,
          border: `1px solid ${s.border}`,
        }}
      >
        {s.icon} {tag}
      </span>
    );
  }

  // ── Loading / error ────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-secondary)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid var(--color-border-secondary)",
              borderTopColor: "var(--color-accent-primary)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ margin: 0, fontSize: 14 }}>Loading profile…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "var(--color-text-secondary)",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 48, margin: 0 }}>🎬</p>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          {error || "User not found"}
        </p>
        <button
          onClick={() => router.back()}
          style={{ ...cancelBtnStyle, marginTop: 8 }}
        >
          ← Go back
        </button>
      </div>
    );
  }

  const coverSrc = coverPreview ?? user.coverImage;
  const avatarSrc = avatarPreview ?? user.avatar;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-poppins)",
      }}
    >
      {/* ── Cover + Header ─────────────────────────────────── */}
      <div style={{ position: "relative", margin: "0 0 0 0" }}>
        {/* Cover image */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 220,
            borderRadius: "0 0 24px 24px",
            overflow: "hidden",
            backgroundColor: "var(--color-bg-secondary)",
            cursor: isOwner && editMode ? "pointer" : "default",
          }}
          onClick={() => {
            if (isOwner && editMode) coverInputRef.current?.click();
          }}
        >
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              alt="Cover"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(135deg, rgba(255,107,0,0.2) 0%, rgba(139,92,246,0.15) 100%)",
              }}
            />
          )}
          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)",
            }}
          />

          {/* Cover change hint */}
          {isOwner && editMode && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.35)",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                gap: 8,
              }}
            >
              📷 Click to change cover
            </div>
          )}

          {/* Username + tags on cover */}
          {!editMode && (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 100,
                right: 16,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(1.1rem,4vw,1.6rem)",
                  fontWeight: 800,
                  color: "#fff",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                {user.username}
                {user.isVerified && (
                  <span style={{ marginLeft: 6, fontSize: 16 }} title="Verified">
                    ✅
                  </span>
                )}
              </h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 2 }}>
                {user.profileTags?.map((tag) => renderTagBadge(tag))}
              </div>
            </div>
          )}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleCoverChange}
        />

        {/* Avatar — positioned over the cover bottom edge */}
        <div
          style={{
            position: "absolute",
            bottom: -36,
            left: 20,
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: "relative",
              cursor: isOwner && editMode ? "pointer" : "default",
            }}
            onClick={() => {
              if (isOwner && editMode) avatarInputRef.current?.click();
            }}
          >
            <Avatar
              src={avatarSrc}
              username={user.username}
              size={72}
              style={{
                borderRadius: 16,
                border: isOwner
                  ? "3px solid var(--color-accent-primary)"
                  : "3px solid var(--color-bg-elevated)",
                objectFit: "cover",
              }}
            />
            {isOwner && editMode && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 16,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "#fff",
                }}
              >
                📷
              </div>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Action buttons */}
        <div
          style={{
            position: "absolute",
            bottom: -52,
            right: 16,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            onClick={handleShare}
            style={{
              ...cancelBtnStyle,
              padding: "6px 12px",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4,
              ...(shareCopied
                ? { color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)" }
                : {}),
            }}
            title="Share this profile"
          >
            {shareCopied ? "✓ Copied" : "🔗 Share"}
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              ...cancelBtnStyle,
              padding: "6px 12px",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            title="Refresh profile"
          >
            {refreshing ? "⟳" : "⟳"} Refresh
          </button>

          {isOwner ? (
            <button
              onClick={() => {
                if (editMode) {
                  setEditMode(false);
                  setCoverPreview(null);
                  setAvatarPreview(null);
                  setAvatarFile(null);
                  setCoverFile(null);
                  setSaveError("");
                } else {
                  setEditMode(true);
                }
              }}
              style={{
                ...saveBtnStyle,
                padding: "6px 16px",
                fontSize: 13,
                backgroundColor: editMode
                  ? "var(--color-bg-elevated)"
                  : "var(--color-accent-primary)",
                color: editMode ? "var(--color-text-primary)" : "#fff",
                border: editMode
                  ? "1px solid var(--color-border-secondary)"
                  : "none",
              }}
            >
              {editMode ? "✕ Cancel" : "✎ Edit"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Spacer for avatar overflow */}
      <div style={{ height: 56 }} />

      {/* ── Main layout ─────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 16px 40px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
        }}
        className="lg:grid-cols-[280px_1fr]"
      >
        {/* ── Left sidebar / Edit form ─────────────────────── */}
        <aside>
          {editMode ? (
            /* Edit form */
            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                borderRadius: 16,
                border: "1px solid var(--color-border-secondary)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                Edit Profile
              </h3>

              <div>
                <label style={labelStyle}>Username</label>
                <input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, username: e.target.value }))
                  }
                  style={{
                    ...inputStyle,
                    borderColor:
                      usernameStatus === "unavailable"
                        ? "#ef4444"
                        : usernameStatus === "available"
                          ? "#22c55e"
                          : (inputStyle.borderColor as string | undefined),
                  }}
                  required
                  aria-invalid={usernameStatus === "unavailable"}
                />
                {usernameStatus !== "idle" && (
                  <p
                    style={{
                      margin: "5px 2px 0",
                      fontSize: 12,
                      fontWeight: 500,
                      color:
                        usernameStatus === "unavailable"
                          ? "#ef4444"
                          : usernameStatus === "available"
                            ? "#22c55e"
                            : "var(--color-text-secondary)",
                    }}
                  >
                    {usernameStatus === "checking"
                      ? "Checking availability…"
                      : usernameMsg}
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, dob: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bio: e.target.value }))
                  }
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Tell the world about yourself…"
                />
              </div>

              <div>
                <label style={{ ...labelStyle, marginBottom: 8 }}>
                  Profile Tags{" "}
                  <span style={{ fontWeight: 400, opacity: 0.6 }}>
                    (max {MAX_PROFILE_TAGS})
                  </span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {ALL_TAGS.map((tag) => {
                    const s = TAG_STYLES[tag];
                    const selected = formData.profileTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: `1px solid ${selected ? s.border : "var(--color-border-secondary)"}`,
                          backgroundColor: selected
                            ? s.bg
                            : "var(--color-bg-secondary)",
                          color: selected ? s.text : "var(--color-text-secondary)",
                          transition: "all 0.15s",
                        }}
                      >
                        {s.icon} {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {saveError && (
                <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>
                  {saveError}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    usernameStatus === "unavailable" ||
                    usernameStatus === "checking"
                  }
                  style={{
                    ...saveBtnStyle,
                    flex: 1,
                    ...(saving ||
                    usernameStatus === "unavailable" ||
                    usernameStatus === "checking"
                      ? { opacity: 0.6, cursor: "not-allowed" }
                      : {}),
                  }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setCoverPreview(null);
                    setAvatarPreview(null);
                    setAvatarFile(null);
                    setCoverFile(null);
                    setSaveError("");
                  }}
                  style={cancelBtnStyle}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Sidebar info */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Contact card */}
              <div style={sideCardStyle}>
                <h4 style={sideCardTitleStyle}>Contact</h4>
                <p style={sideInfoRowStyle}>
                  <span style={{ opacity: 0.55 }}>Username</span>
                  <span style={{ fontWeight: 600 }}>{user.username}</span>
                </p>
              </div>

              {/* Profile tags */}
              {user.profileTags?.length > 0 && (
                <div style={sideCardStyle}>
                  <h4 style={sideCardTitleStyle}>Profile Tags</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {user.profileTags.map((tag) => renderTagBadge(tag))}
                  </div>
                </div>
              )}

              {/* Allowed genres/ratings */}
              {user.allowedGenres && user.allowedGenres.length > 0 && (
                <div style={sideCardStyle}>
                  <h4 style={sideCardTitleStyle}>Allowed Ratings</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {user.allowedGenres.map((g) => (
                      <span
                        key={g}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: "rgba(255,107,0,0.1)",
                          color: "var(--color-accent-primary)",
                          border: "1px solid rgba(255,107,0,0.25)",
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Marketplace mode toggle (owner, buyer/seller only) */}
              {isOwner &&
                user.userType &&
                user.userType !== "normalUser" && (
                  <div style={sideCardStyle}>
                    <h4 style={sideCardTitleStyle}>Marketplace Mode</h4>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                        {activeMode === "buyer" ? "🛒 Buyer" : "🏪 Seller"}
                      </span>
                      <button
                        onClick={handleModeToggle}
                        disabled={changingMode}
                        style={{
                          position: "relative",
                          width: 48,
                          height: 26,
                          borderRadius: 9999,
                          border: "none",
                          backgroundColor:
                            activeMode === "seller"
                              ? "var(--color-accent-primary)"
                              : "var(--color-border-secondary)",
                          cursor: changingMode ? "wait" : "pointer",
                          transition: "background-color 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 3,
                            left: activeMode === "seller" ? 26 : 4,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            backgroundColor: "#fff",
                            transition: "left 0.2s",
                          }}
                        />
                      </button>
                    </div>
                  </div>
                )}

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div style={{ ...sideCardStyle, textAlign: "center" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--color-accent-primary)",
                    }}
                  >
                    {user.followers?.length ?? 0}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Followers
                  </p>
                </div>
                <div style={{ ...sideCardStyle, textAlign: "center" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--color-accent-primary)",
                    }}
                  >
                    {user.followings?.length ?? 0}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Following
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── Right column ─────────────────────────────────── */}
        <div style={{ minWidth: 0 }}>
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              gap: 4,
              overflowX: "auto",
              borderBottom: "1px solid var(--color-divider)",
              marginBottom: 24,
              paddingBottom: 0,
              scrollbarWidth: "none",
            }}
          >
            {tabs.map((tab) => {
              const isRoute = !!tab.route;
              const isActive = activeTab === tab.id;
              const btnStyle: React.CSSProperties = {
                padding: "10px 16px",
                borderRadius: "10px 10px 0 0",
                border: "none",
                borderBottom: isActive
                  ? "2px solid var(--color-accent-primary)"
                  : "2px solid transparent",
                backgroundColor: "transparent",
                color: isActive
                  ? "var(--color-accent-primary)"
                  : "var(--color-text-secondary)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              };

              if (isRoute) {
                return (
                  <button
                    key={tab.id}
                    style={btnStyle}
                    onClick={() => router.push(tab.route!)}
                  >
                    {tab.label}
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  style={btnStyle}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Tab: Videos ──────────────────────────────── */}
          {activeTab === "videos" && (
            <div>
              {isOwner && (
                <div role="tablist" aria-label="Video filter" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {([
                    { id: "published", label: "Published" },
                    { id: "drafts", label: drafts ? `Drafts (${drafts.length})` : "Drafts" },
                  ] as const).map((chip) => {
                    const on = videoView === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setVideoView(chip.id)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 9999,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: on ? "1px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
                          backgroundColor: on ? "var(--color-accent-primary)" : "transparent",
                          color: on ? "var(--color-btn-primary-text, #000)" : "var(--color-text-secondary)",
                        }}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {isOwner && videoView === "drafts" ? (
                drafts === null ? null : drafts.length === 0 ? (
                  <EmptyState icon="📝" label="No drafts. Uploads you haven't published show up here" />
                ) : (
                  <DraftsGrid
                    drafts={drafts}
                    onDeleted={(draftId) => setDrafts((prev) => (prev ?? []).filter((d) => d._id !== draftId))}
                  />
                )
              ) : videos.length === 0 ? (
                <EmptyState icon="🎬" label="No videos yet" />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 16,
                  }}
                >
                  {videos.map((v) => (
                    <div key={v._id} style={cardStyle}>
                      {/* Thumbnail */}
                      <div
                        style={{
                          position: "relative",
                          aspectRatio: "16/9",
                          borderRadius: "10px 10px 0 0",
                          overflow: "hidden",
                          backgroundColor: "var(--color-bg-secondary)",
                        }}
                      >
                        {v.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.thumbnail}
                            alt={v.title ?? "Video"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
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
                        {/* Bookmark button */}
                        {authUser && (
                          <button
                            onClick={() => toggleVideoBM(v._id)}
                            disabled={bmPending.has(v._id)}
                            style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              border: "none",
                              backgroundColor: "rgba(0,0,0,0.6)",
                              backdropFilter: "blur(4px)",
                              color: videoBM.has(v._id) ? "#f59e0b" : "#fff",
                              cursor: "pointer",
                              fontSize: 14,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title={
                              videoBM.has(v._id)
                                ? "Remove bookmark"
                                : "Bookmark"
                            }
                          >
                            {videoBM.has(v._id) ? "🔖" : "🏷️"}
                          </button>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: "12px 14px" }}>
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--color-text-primary)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
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
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {v.description}
                          </p>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <button
                            onClick={() =>
                              router.push(
                                "/watch/" + (v.slug ?? v._id),
                              )
                            }
                            style={{
                              ...saveBtnStyle,
                              fontSize: 12,
                              padding: "5px 12px",
                            }}
                          >
                            ▶ Watch
                          </button>

                          {isOwner && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => setEditingVideo(v)}
                                style={{
                                  ...cancelBtnStyle,
                                  fontSize: 12,
                                  padding: "5px 10px",
                                }}
                              >
                                ✎ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(v._id)}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(239,68,68,0.3)",
                                  backgroundColor: "rgba(239,68,68,0.1)",
                                  color: "#ef4444",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                🗑
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Scripts ─────────────────────────────── */}
          {activeTab === "scripts" && (
            <div>
              {scripts.length === 0 ? (
                <EmptyState icon="📝" label="No scripts yet" />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 16,
                  }}
                >
                  {scripts.map((s) => {
                    const preview = s.script
                      ? stripHtml(s.script).slice(0, 140)
                      : "";
                    return (
                      <div key={s._id} style={cardStyle}>
                        <div style={{ padding: "16px 14px" }}>
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {s.title ?? "Untitled Script"}
                          </p>
                          {preview && (
                            <p
                              style={{
                                margin: "0 0 8px",
                                fontSize: 12,
                                color: "var(--color-text-secondary)",
                                lineHeight: 1.6,
                              }}
                            >
                              {preview}
                              {s.script &&
                                stripHtml(s.script).length > 140 &&
                                "…"}
                            </p>
                          )}
                          <p
                            style={{
                              margin: "0 0 12px",
                              fontSize: 11,
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            {formatDate(s.createdAt)}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() =>
                                  window.open(
                                    `${APP_URL}/scripts/${s._id}`,
                                    "_blank",
                                  )
                                }
                                style={{
                                  ...saveBtnStyle,
                                  fontSize: 12,
                                  padding: "5px 12px",
                                }}
                              >
                                Read ↗
                              </button>
                              {authUser && (
                                <button
                                  onClick={() => toggleScriptBM(s._id)}
                                  disabled={bmPending.has(s._id)}
                                  style={{
                                    ...cancelBtnStyle,
                                    fontSize: 12,
                                    padding: "5px 10px",
                                    color: scriptBM.has(s._id)
                                      ? "#f59e0b"
                                      : undefined,
                                    borderColor: scriptBM.has(s._id)
                                      ? "#f59e0b"
                                      : undefined,
                                  }}
                                  title={
                                    scriptBM.has(s._id)
                                      ? "Remove bookmark"
                                      : "Bookmark"
                                  }
                                >
                                  {scriptBM.has(s._id) ? "🔖" : "🏷️"}
                                </button>
                              )}
                            </div>

                            {isOwner && (
                              <button
                                onClick={() => handleDeleteScript(s._id)}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(239,68,68,0.3)",
                                  backgroundColor: "rgba(239,68,68,0.1)",
                                  color: "#ef4444",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Subscriptions ───────────────────────── */}
          {activeTab === "subscriptions" && isOwner && (
            <div>
              {subHistory.length === 0 ? (
                <EmptyState icon="💳" label="No subscription history" />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {subHistory.map((entry, i) => {
                    const isActive =
                      entry.expiresAt && new Date(entry.expiresAt) > new Date();
                    return (
                      <div
                        key={entry._id ?? i}
                        style={{
                          ...cardStyle,
                          padding: "16px 18px",
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "8px 16px",
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: "0 0 4px",
                              fontSize: 15,
                              fontWeight: 700,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            {entry.planName ?? entry.planId}
                          </p>
                          {entry.amount != null && (
                            <p
                              style={{
                                margin: "0 0 4px",
                                fontSize: 13,
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {entry.currency
                                ? `${entry.amount} ${entry.currency.toUpperCase()}`
                                : String(entry.amount)}
                              {entry.provider && (
                                <span style={{ opacity: 0.6 }}>
                                  {" "}
                                  via {entry.provider}
                                </span>
                              )}
                            </p>
                          )}
                          {entry.activatedAt && (
                            <p
                              style={{
                                margin: "0 0 2px",
                                fontSize: 12,
                                color: "var(--color-text-tertiary)",
                              }}
                            >
                              Activated: {formatDate(entry.activatedAt)}
                            </p>
                          )}
                          {entry.expiresAt && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                color: "var(--color-text-tertiary)",
                              }}
                            >
                              Expires: {formatDate(entry.expiresAt)}
                            </p>
                          )}
                          {entry.paypalOrderId && (
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontSize: 11,
                                color: "var(--color-text-tertiary)",
                                fontFamily: "monospace",
                              }}
                            >
                              Order: {entry.paypalOrderId}
                            </p>
                          )}
                        </div>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 700,
                            backgroundColor: isActive
                              ? "rgba(16,185,129,0.1)"
                              : "rgba(107,114,128,0.1)",
                            color: isActive ? "#10b981" : "#6b7280",
                            border: isActive
                              ? "1px solid rgba(16,185,129,0.25)"
                              : "1px solid rgba(107,114,128,0.25)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isActive ? "Active" : "Expired"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: About ───────────────────────────────── */}
          {activeTab === "about" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {/* Profile details */}
              <div style={cardStyle}>
                <div style={{ padding: "16px 18px" }}>
                  <h4 style={cardTitleStyle}>Profile Details</h4>
                  <AboutRow label="Joined" value={formatDate(user.createdAt)} />
                  {user.dob && (
                    <AboutRow
                      label="Date of Birth"
                      value={formatDate(user.dob)}
                    />
                  )}
                  <AboutRow
                    label="Verified"
                    value={user.isVerified ? "✅ Yes" : "No"}
                  />
                </div>
              </div>

              {/* Marketplace */}
              <div style={cardStyle}>
                <div style={{ padding: "16px 18px" }}>
                  <h4 style={cardTitleStyle}>Marketplace</h4>
                  <AboutRow
                    label="Role"
                    value={
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: "rgba(255,107,0,0.1)",
                          color: "var(--color-accent-primary)",
                          border: "1px solid rgba(255,107,0,0.25)",
                        }}
                      >
                        {user.userType ?? "user"}
                      </span>
                    }
                  />
                  <AboutRow
                    label="Subscription"
                    value={user.hasPaid ? "✅ Active" : "Free tier"}
                  />
                </div>
              </div>

              {/* Profile tags */}
              {user.profileTags?.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ padding: "16px 18px" }}>
                    <h4 style={cardTitleStyle}>Profile Tags</h4>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 7,
                        marginTop: 8,
                      }}
                    >
                      {user.profileTags.map((tag) => renderTagBadge(tag))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <div style={cardStyle}>
                  <div style={{ padding: "16px 18px" }}>
                    <h4 style={cardTitleStyle}>Bio</h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {user.bio}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video edit modal */}
      {editingVideo && (
        <VideoEditModal
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onSaved={(updated) => {
            setVideos((prev) =>
              prev.map((v) => (v._id === updated._id ? updated : v)),
            );
            setEditingVideo(null);
          }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 1024px) {
          .lg\\:grid-cols-\\[280px_1fr\\] { grid-template-columns: 280px 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────

const sideCardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-elevated)",
  borderRadius: 14,
  border: "1px solid var(--color-border-secondary)",
  padding: "14px 16px",
};

const sideCardTitleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-text-tertiary)",
};

const sideInfoRowStyle: React.CSSProperties = {
  margin: "0 0 6px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "var(--color-text-primary)",
  flexWrap: "wrap",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-elevated)",
  borderRadius: 14,
  border: "1px solid var(--color-border-secondary)",
  overflow: "hidden",
};

const cardTitleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 13,
  fontWeight: 700,
  color: "var(--color-text-primary)",
};

function AboutRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: "7px 0",
        borderBottom: "1px solid var(--color-divider)",
        fontSize: 13,
        flexWrap: "wrap",
      }}
    >
      <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "var(--color-text-tertiary)",
      }}
    >
      <p style={{ fontSize: 40, margin: "0 0 12px" }}>{icon}</p>
      <p style={{ margin: 0, fontSize: 15 }}>{label}</p>
    </div>
  );
}
