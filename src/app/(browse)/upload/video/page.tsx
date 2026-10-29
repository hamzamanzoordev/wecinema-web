"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, FileVideo, Loader2, Navigation, RotateCcw, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { listDrafts, type VideoDraft } from "@/features/upload/api/drafts";
import { DraftsGrid } from "@/features/upload/components/DraftCards";
import { useUploads, VIDEO_MAX_BYTES } from "@/features/upload/context/UploadManagerProvider";
import { VIDEO_ACCEPT } from "@/features/upload/lib/videoOptions";

const PROMISES = [
  { icon: RotateCcw,  title: "Never starts over",  text: "If your internet drops, the upload pauses and picks up where it stopped." },
  { icon: ShieldCheck, title: "Saved as a draft",  text: "Only you can see it until you press Publish. Details save as you type." },
  { icon: Navigation,  title: "Keep browsing",     text: "Uploads run in the background. Watch progress on your profile icon." },
];

export default function UploadVideoPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { startUpload } = useUploads();

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [starting, setStarting] = useState(false);
  const [drafts, setDrafts] = useState<VideoDraft[] | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?redirect=/upload/video");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listDrafts()
      .then((d) => { if (!cancelled) setDrafts(d); })
      .catch(() => { if (!cancelled) setDrafts([]); });
    return () => { cancelled = true; };
  }, [status]);

  const handleFile = async (file: File | undefined) => {
    if (!file || starting) return;
    if (!file.type.startsWith("video/")) { toast.error("Please choose a video file"); return; }
    if (file.size > VIDEO_MAX_BYTES) { toast.error("Video must be under 2 GB"); return; }

    setStarting(true);
    try {
      const draftId = await startUpload(file);
      router.push(`/upload/video/${draftId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the upload");
      setStarting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 16px 72px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>
          Upload video
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--color-text-tertiary)" }}>
          Share your film with the WeCinema community
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Select a video file to upload"
        aria-busy={starting}
        onClick={() => !starting && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !starting) { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFile(e.dataTransfer.files?.[0]); }}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          border: `2px dashed ${dragging ? "var(--color-accent-primary)" : "var(--color-border-secondary)"}`,
          background: dragging
            ? "var(--accent-soft)"
            : "radial-gradient(120% 90% at 50% 0%, var(--accent-soft) 0%, var(--color-bg-elevated) 60%)",
          padding: "56px 20px 48px",
          textAlign: "center",
          cursor: starting ? "wait" : "pointer",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        <div
          style={{
            width: 96, height: 96, borderRadius: "50%", margin: "0 auto 18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--color-bg-primary)",
            boxShadow: `0 0 0 10px var(--accent-soft), 0 12px 32px var(--accent-ring)`,
            transform: dragging ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.2s",
          }}
        >
          {starting
            ? <Loader2 size={40} className="animate-spin" color="var(--color-accent-primary)" aria-hidden />
            : <CloudUpload size={42} color="var(--color-accent-primary)" aria-hidden />}
        </div>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>
          {starting ? "Starting your upload…" : dragging ? "Drop to upload" : "Drag and drop a video file to upload"}
        </p>
        <p style={{ margin: "6px 0 22px", fontSize: 13, color: "var(--color-text-tertiary)" }}>
          Your video stays private as a draft until you publish it.
        </p>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 12,
            background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
            color: "var(--color-btn-primary-text, #000)", fontSize: 14, fontWeight: 700,
            boxShadow: "0 4px 20px var(--accent-ring)",
            opacity: starting ? 0.6 : 1,
          }}
        >
          <FileVideo size={16} aria-hidden />
          Select file
        </span>
        <p style={{ margin: "18px 0 0", fontSize: 11.5, color: "var(--color-text-tertiary)" }}>
          MP4, MOV, WebM or AVI · up to 2 GB · 16:9, 1080p recommended
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={VIDEO_ACCEPT}
          style={{ display: "none" }}
          onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ""; }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginTop: 16 }}>
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            style={{
              display: "flex", gap: 12, padding: "14px 16px", borderRadius: 14,
              background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-secondary)",
            }}
          >
            <Icon size={18} color="var(--color-accent-primary)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{text}</p>
            </div>
          </div>
        ))}
      </div>

      {drafts && drafts.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)" }}>
            Continue your drafts
          </h2>
          <DraftsGrid
            drafts={drafts}
            onDeleted={(id) => setDrafts((prev) => (prev ?? []).filter((d) => d._id !== id))}
          />
        </section>
      )}
    </div>
  );
}
