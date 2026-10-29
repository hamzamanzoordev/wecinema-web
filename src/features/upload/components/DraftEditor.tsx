"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle, CircleDashed, Cloud, CloudOff,
  Eye, FileVideo, Film, Loader2, Lock, Pause, Play, Trash2, UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AppError } from "@/features/auth/services/apiClient";
import { getRentalEligibility } from "@/features/watch/api/rental.service";
import {
  deleteDraft, getDraft, publishDraft, updateDraft,
  type DraftChanges, type PublishResult, type VideoDraft,
} from "@/features/upload/api/drafts";
import { uploadDirectToS3 } from "@/features/upload/services/presignedUpload";
import { uploadStore } from "@/features/upload/engine/uploadStore";
import { useUploads, sameFile } from "@/features/upload/context/UploadManagerProvider";
import { ThumbnailPicker } from "@/features/upload/components/ThumbnailPicker";
import { TagsInput } from "@/features/upload/components/TagsInput";
import {
  FieldLabel, MultiSelect, ProgressBar, formatBytes, formatDuration, inputStyle, useObjectUrl,
} from "@/features/upload/components/UploadUI";
import {
  TONE_COLOR, formatSpeed, jobPercent, uploadStatusText, uploadTone, type UploadTone,
} from "@/features/upload/lib/uploadStatus";
import {
  DEFAULT_RENTAL_CENTS, GENRES, PLATFORM_FEE_RATE, RATINGS, RENTAL_PLANS, THEMES, VIDEO_ACCEPT,
} from "@/features/upload/lib/videoOptions";
import { extractHashtags } from "@/lib/tags";

// ── Form model ────────────────────────────────────────────────

interface FormValues {
  title: string;
  description: string;
  genre: string[];
  theme: string[];
  rating: string;
  tags: string[];
  isShort: boolean;
  hasPaid: boolean;
  isForSale: boolean;
  isRentable: boolean;
  rentalPriceCents: number;
}

const FORM_KEYS: (keyof FormValues)[] = [
  "title", "description", "genre", "theme", "rating", "tags",
  "isShort", "hasPaid", "isForSale", "isRentable", "rentalPriceCents",
];

const SERVER_SAVE_DELAY_MS = 2500;
const LOCAL_SAVE_DELAY_MS = 300;
const SAVE_RETRY_MS = 10_000;

function valuesFromDraft(d: VideoDraft): FormValues {
  return {
    title: d.title ?? "",
    description: d.description ?? "",
    genre: d.genre ?? [],
    theme: d.theme ?? [],
    rating: d.rating ?? "",
    tags: d.tags ?? [],
    isShort: d.isShort,
    hasPaid: d.hasPaid,
    isForSale: d.isForSale,
    isRentable: d.isRentable,
    rentalPriceCents: d.rentalPriceCents ?? DEFAULT_RENTAL_CENTS,
  };
}

function changesBetween(next: FormValues, base: FormValues): DraftChanges {
  const out: Record<string, unknown> = {};
  for (const key of FORM_KEYS) {
    if (JSON.stringify(next[key]) !== JSON.stringify(base[key])) out[key] = next[key];
  }
  return out as DraftChanges;
}

type Tab = "details" | "monetization" | "visibility";
type SaveState = "idle" | "pending" | "saving" | "saved" | "offline" | "error";

const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "monetization", label: "Monetization" },
  { id: "visibility", label: "Visibility" },
];

// ── Small pieces ──────────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border-secondary)",
  borderRadius: 20,
};

function OptionToggle({
  label, desc, checked, onChange, disabled, children,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: checked ? "1px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
        backgroundColor: checked ? "var(--accent-soft)" : "var(--color-bg-primary)",
        transition: "all 0.15s",
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: disabled ? "not-allowed" : "pointer" }}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: 16, height: 16, marginTop: 2, accentColor: "var(--color-accent-primary)", cursor: "inherit" }}
        />
        <span>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</span>
          <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.45 }}>{desc}</span>
        </span>
      </label>
      {children}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { icon: React.ReactNode; text: string; color: string } | null> = {
    idle: null,
    pending: { icon: <CircleDashed size={14} />, text: "Unsaved changes", color: "var(--color-text-tertiary)" },
    saving: { icon: <Loader2 size={14} className="animate-spin" />, text: "Saving…", color: "var(--color-text-tertiary)" },
    saved: { icon: <Cloud size={14} />, text: "All changes saved as draft", color: "var(--color-text-tertiary)" },
    offline: { icon: <CloudOff size={14} />, text: "Offline: saved on this device", color: TONE_COLOR.waiting },
    error: { icon: <AlertTriangle size={14} />, text: "Couldn't save, retrying", color: TONE_COLOR.error },
  };
  const entry = map[state];
  if (!entry) return null;
  return (
    <span aria-live="polite" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: entry.color, whiteSpace: "nowrap" }}>
      {entry.icon}
      {entry.text}
    </span>
  );
}

// ── Editor ────────────────────────────────────────────────────

export function DraftEditor({ draftId }: { draftId: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const uploads = useUploads();
  const job = uploads.getJob(draftId);
  const localFile = uploads.getFile(draftId);

  const [draft, setDraft] = useState<VideoDraft | null>(null);
  const [loadError, setLoadError] = useState<"not-found" | "error" | null>(null);
  const [values, setValues] = useState<FormValues | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [tab, setTab] = useState<Tab>("details");
  const [intent, setIntent] = useState<"publish" | "draft">("publish");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbSaving, setThumbSaving] = useState(false);
  const [payoutState, setPayoutState] = useState<"loading" | "eligible" | "blocked">("loading");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<PublishResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const valuesRef = useRef<FormValues | null>(null);
  const savedRef = useRef<FormValues | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  // flush() re-schedules itself; going through a ref keeps the callback stable.
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  const loaded = useRef(false);
  const reselectRef = useRef<HTMLInputElement>(null);

  // ── Load ─────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "authenticated" || loaded.current) return;
    let cancelled = false;
    (async () => {
      try {
        const [serverDraft, local] = await Promise.all([getDraft(draftId), uploadStore.getForm(draftId)]);
        if (cancelled) return;
        loaded.current = true;
        const server = valuesFromDraft(serverDraft);
        savedRef.current = server;
        // Edits that never reached the server (offline, or the tab closed
        // mid-debounce) are replayed over the server copy.
        const initial = local?.unsynced ? { ...server, ...(local.values as Partial<FormValues>) } : server;
        valuesRef.current = initial;
        setDraft(serverDraft);
        setValues(initial);
        if (local?.unsynced) setSaveState("pending");
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof AppError && err.status === 404 ? "not-found" : "error");
      }
    })();
    return () => { cancelled = true; };
  }, [draftId, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    getRentalEligibility()
      .then((res) => { if (!cancelled) setPayoutState(res.eligible ? "eligible" : "blocked"); })
      .catch(() => { if (!cancelled) setPayoutState("blocked"); });
    return () => { cancelled = true; };
  }, [status]);

  // When this browser's upload finishes, fetch the draft again for the
  // server-side state and a playable URL.
  const jobState = job?.state;
  useEffect(() => {
    if (jobState !== "completed") return;
    getDraft(draftId)
      .then((fresh) => setDraft((d) => (d ? { ...d, upload: fresh.upload, file: fresh.file } : fresh)))
      .catch(() => {});
  }, [jobState, draftId]);

  // ── Auto-save ────────────────────────────────────────────────

  const flush = useCallback(async (): Promise<boolean> => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    while (inFlight.current) await inFlight.current;

    const current = valuesRef.current;
    const saved = savedRef.current;
    if (!current || !saved) return true;
    const changes = changesBetween(current, saved);
    if (Object.keys(changes).length === 0) {
      setSaveState((s) => (s === "pending" || s === "saving" ? "saved" : s));
      return true;
    }

    let ok = false;
    setSaveState("saving");
    const request = (async () => {
      try {
        await updateDraft(draftId, changes);
        savedRef.current = current;
        ok = true;
        const stillDirty = Object.keys(changesBetween(valuesRef.current ?? current, current)).length > 0;
        if (stillDirty) {
          setSaveState("pending");
          saveTimer.current = setTimeout(() => void flushRef.current(), SERVER_SAVE_DELAY_MS);
        } else {
          setSaveState("saved");
          void uploadStore.putForm({ draftId, values: { ...current }, unsynced: false, savedAt: Date.now() });
        }
      } catch (err) {
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        setSaveState(offline || !(err instanceof AppError) || err.status === 401 ? "offline" : "error");
        saveTimer.current = setTimeout(() => void flushRef.current(), SAVE_RETRY_MS);
      }
    })();
    inFlight.current = request;
    await request;
    inFlight.current = null;
    return ok;
  }, [draftId]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    const base = valuesRef.current;
    if (!base) return;
    const next = { ...base, [key]: value };
    valuesRef.current = next;
    setValues(next);
    setSaveState("pending");

    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      void uploadStore.putForm({ draftId, values: { ...next }, unsynced: true, savedAt: Date.now() });
    }, LOCAL_SAVE_DELAY_MS);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flush(), SERVER_SAVE_DELAY_MS);
  };

  // Save right away when the connection returns, the tab is hidden, or the editor unmounts.
  useEffect(() => {
    const onOnline = () => void flush();
    const onHidden = () => { if (document.visibilityState === "hidden") void flush(); };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onHidden);
      if (localTimer.current) clearTimeout(localTimer.current);
      void flush();
    };
  }, [flush]);

  // A lost session is recoverable — resave once the creator signs back in.
  useEffect(() => {
    if (status === "authenticated" && loaded.current) void flush();
  }, [status, flush]);

  const changeTab = (next: Tab) => {
    setTab(next);
    void flush();
  };

  // ── Thumbnail ────────────────────────────────────────────────

  const handleThumbnail = async (file: File | null) => {
    setThumbFile(file);
    if (!file) return;
    setThumbSaving(true);
    try {
      const { key } = await uploadDirectToS3("thumbnail", file);
      const updated = await updateDraft(draftId, { thumbnailKey: key });
      setDraft((d) => (d ? { ...d, thumbnail: updated.thumbnail, thumbnailKey: updated.thumbnailKey } : d));
    } catch (err) {
      toast.error(
        err instanceof Error && navigator.onLine !== false
          ? `Couldn't save the thumbnail: ${err.message}`
          : "You're offline. Pick the thumbnail again when you're back online.",
      );
    } finally {
      setThumbSaving(false);
    }
  };

  // ── Upload status ────────────────────────────────────────────

  const localUrl = useObjectUrl(localFile ?? null);
  const videoSrc = localUrl ?? draft?.file ?? undefined;
  const uploadDone = draft?.upload.state === "uploaded" || job?.state === "completed";

  const uploadView = useMemo((): { tone: UploadTone; pct: number; text: string; needsFile: boolean } => {
    if (job && job.state !== "cancelled") {
      return {
        tone: uploadTone(job.state),
        pct: job.state === "completed" ? 100 : jobPercent(job),
        text: uploadStatusText(job),
        needsFile: job.state === "needs-file",
      };
    }
    if (draft?.upload.state === "uploaded") return { tone: "done", pct: 100, text: "Upload complete", needsFile: false };
    if (draft?.upload.state === "failed") {
      return { tone: "error", pct: 0, text: "This upload expired. Delete the draft and upload the file again.", needsFile: false };
    }
    return { tone: "waiting", pct: 0, text: "Upload interrupted. Select the same file to resume", needsFile: true };
  }, [job, draft?.upload.state]);

  const handleReselect = async (file: File | undefined) => {
    if (!file || !draft) return;
    if (!sameFile(file, { name: draft.upload.fileName ?? "", size: draft.upload.fileSize ?? -1 })) {
      toast.error(`That's a different file. Choose "${draft.upload.fileName}" to resume.`);
      return;
    }
    try {
      await uploads.resumeWithFile(draftId, file);
      toast.success("Upload resumed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't resume the upload");
    }
  };

  // ── Publish / delete ─────────────────────────────────────────

  const checklist = values && draft ? [
    { label: "Video upload finished", ok: uploadDone, tab: null as Tab | null },
    { label: "Title", ok: values.title.trim().length > 0, tab: "details" as Tab },
    { label: "Thumbnail", ok: !!draft.thumbnailKey, tab: "details" as Tab },
    { label: "At least one genre", ok: values.genre.length > 0, tab: "details" as Tab },
    { label: "Rating", ok: !!values.rating, tab: "details" as Tab },
  ] : [];
  const firstMissing = checklist.find((c) => !c.ok);
  const canPublish = !!values && !firstMissing && !thumbSaving;

  const handlePublish = async () => {
    if (!canPublish) {
      if (firstMissing) {
        toast.error(firstMissing.tab ? `Add a ${firstMissing.label.toLowerCase()} before publishing` : "Wait for the upload to finish before publishing");
        if (firstMissing.tab) changeTab(firstMissing.tab);
      }
      return;
    }
    setPublishing(true);
    try {
      const saved = await flush();
      if (!saved) throw new Error("Couldn't save your latest changes. Check your connection and try again.");
      const result = await publishDraft(draftId);
      void uploadStore.deleteForm(draftId);
      uploads.dismiss(draftId);
      if (result.rentalWarning) {
        toast.error(
          result.rentalWarning.message ?? "Renting couldn't be enabled. Connect payouts, then turn it on from your video.",
          { duration: 7000 },
        );
      }
      setPublished(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't publish the video");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    const saved = await flush();
    if (saved) toast.success(uploadDone ? "Draft saved" : "Draft saved. The upload keeps going in the background");
    else toast("Saved on this device. It syncs when you're back online", { icon: "💾" });
    router.push("/upload/video");
  };

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      if (job) await uploads.cancel(draftId);
      else {
        await deleteDraft(draftId);
        void uploadStore.deleteForm(draftId);
      }
      loaded.current = false;
      savedRef.current = null;
      valuesRef.current = null;
      toast.success("Draft deleted");
      router.push("/upload/video");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the draft");
    }
  };

  // ── Render: states before the editor ─────────────────────────

  const signInHref = `/login?redirect=${encodeURIComponent(`/upload/video/${draftId}`)}`;

  if (published) {
    const watchHref = `/watch/${published.slug ?? published.videoId}`;
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          style={{
            width: 80, height: 80, borderRadius: "50%", background: "rgba(74,222,128,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
          }}
        >
          <CheckCircle style={{ width: 44, height: 44, color: "rgb(74,222,128)" }} />
        </motion.div>
        <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "var(--color-text-primary)" }}>
          Your video is published!
        </h2>
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
          It&apos;s being processed and will appear on your profile shortly.
        </p>
        <p style={{ margin: "0 0 32px", fontSize: 12, color: "var(--color-text-tertiary)", opacity: 0.7 }}>
          Processing usually takes 2–10 minutes depending on file size.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href={watchHref}
            style={{
              padding: "11px 28px", borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: "none",
              background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
              color: "var(--color-btn-primary-text, #000)",
            }}
          >
            View video
          </Link>
          <Link
            href="/upload/video"
            style={{
              padding: "11px 28px", borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: "none",
              color: "var(--color-text-secondary)", border: "1px solid var(--color-border-secondary)",
            }}
          >
            Upload another
          </Link>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
        <Film size={40} color="var(--color-text-tertiary)" style={{ margin: "0 auto 14px" }} aria-hidden />
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "var(--color-text-primary)" }}>
          {loadError === "not-found" ? "This draft doesn't exist" : "Couldn't load this draft"}
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "var(--color-text-tertiary)" }}>
          {loadError === "not-found"
            ? "It may have been published or deleted."
            : "Check your connection and try again."}
        </p>
        <Link href="/upload/video" style={{ color: "var(--color-accent-primary)", fontWeight: 700, fontSize: 14 }}>
          Back to uploads
        </Link>
      </div>
    );
  }

  if (!draft || !values) {
    if (status === "unauthenticated") {
      return (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
          <Lock size={36} color="var(--color-accent-primary)" style={{ margin: "0 auto 14px" }} aria-hidden />
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "var(--color-text-primary)" }}>
            Sign in to continue
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "var(--color-text-tertiary)" }}>
            Your draft and upload are saved.
          </p>
          <Link
            href={signInHref}
            style={{
              padding: "11px 28px", borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: "none",
              background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
              color: "var(--color-btn-primary-text, #000)",
            }}
          >
            Sign in
          </Link>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "120px 16px" }}>
        <Loader2 size={30} className="animate-spin" color="var(--color-accent-primary)" aria-label="Loading draft" />
      </div>
    );
  }

  const rentalPlan = RENTAL_PLANS.find((p) => p.priceCents === values.rentalPriceCents) ?? RENTAL_PLANS[1];
  const toneColor = uploadView.tone === "active" ? "var(--color-accent-primary)" : TONE_COLOR[uploadView.tone];
  const canPause = job?.state === "uploading" || job?.state === "preparing";
  const canResume = job?.state === "paused";

  // ── Render: editor ───────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px 0" }}>
      <style>{`
        .draft-editor-bar { position: sticky; bottom: 0; z-index: 40; }
        @media (max-width: 768px) { .draft-editor-bar { bottom: 58px; } }
        .draft-editor-tabs button:focus-visible { outline: 2px solid var(--color-accent-primary); outline-offset: 2px; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <Link
            href="/upload/video"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--color-text-tertiary)", textDecoration: "none" }}
          >
            <ArrowLeft size={14} aria-hidden /> Uploads
          </Link>
          <h1 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {values.title.trim() || "Untitled video"}
          </h1>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      {status === "unauthenticated" && (
        <div
          role="alert"
          style={{
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            padding: "12px 16px", marginBottom: 16, borderRadius: 14,
            border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.08)",
          }}
        >
          <AlertTriangle size={18} color={TONE_COLOR.waiting} aria-hidden />
          <p style={{ margin: 0, flex: 1, minWidth: 200, fontSize: 13, color: "var(--color-text-primary)" }}>
            <strong>Session expired.</strong> Sign in to continue. Your draft and upload are saved.
          </p>
          <Link href={signInHref} style={{ fontSize: 13, fontWeight: 700, color: "var(--color-accent-primary)" }}>
            Sign in
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        {/* ── Left: tabs ───────────────────────────────────── */}
        <div style={{ ...card, minWidth: 0 }} onBlur={() => void flush()}>
          <div
            role="tablist"
            aria-label="Video settings"
            className="draft-editor-tabs"
            style={{ display: "flex", gap: 4, padding: "8px 10px 0", borderBottom: "1px solid var(--color-border-secondary)", overflowX: "auto" }}
          >
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeTab(t.id)}
                  style={{
                    position: "relative", padding: "12px 16px", border: "none", background: "transparent",
                    fontSize: 13.5, fontWeight: active ? 700 : 500, fontFamily: "inherit", cursor: "pointer",
                    color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)", whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                  {active && (
                    <motion.span
                      layoutId="draft-editor-tab"
                      style={{ position: "absolute", left: 10, right: 10, bottom: -1, height: 3, borderRadius: 3, background: "var(--color-accent-primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ padding: "22px 24px 26px" }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                role="tabpanel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {tab === "details" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                    <div>
                      <FieldLabel required>Title</FieldLabel>
                      <input
                        type="text"
                        value={values.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="Add a title that describes your video"
                        maxLength={120}
                        style={inputStyle}
                      />
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "right" }}>
                        {values.title.length}/120
                      </p>
                    </div>

                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <textarea
                        value={values.description}
                        onChange={(e) => update("description", e.target.value)}
                        rows={5}
                        maxLength={5000}
                        placeholder="Tell viewers about your video. What it's about, who made it, what inspired it"
                        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Thumbnail</FieldLabel>
                      <ThumbnailPicker
                        videoSrc={videoSrc}
                        currentUrl={draft.thumbnail ?? undefined}
                        value={thumbFile}
                        onChange={(f) => void handleThumbnail(f)}
                        autoSelect={!draft.thumbnailKey}
                      />
                      {thumbSaving && (
                        <p style={{ margin: "6px 0 0", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                          <Loader2 size={12} className="animate-spin" aria-hidden /> Saving thumbnail…
                        </p>
                      )}
                    </div>

                    <div>
                      <FieldLabel required>Genre</FieldLabel>
                      <MultiSelect options={GENRES} value={values.genre} onChange={(v) => update("genre", v)} customPlaceholder="Add a custom genre…" />
                    </div>

                    <div>
                      <FieldLabel>Themes</FieldLabel>
                      <MultiSelect options={THEMES} value={values.theme} onChange={(v) => update("theme", v)} customPlaceholder="Add a custom theme…" />
                    </div>

                    <div>
                      <FieldLabel>Tags &amp; hashtags</FieldLabel>
                      <TagsInput
                        value={values.tags}
                        onChange={(v) => update("tags", v)}
                        inherited={extractHashtags(values.description)}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Rating</FieldLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {RATINGS.map((r) => {
                          const on = values.rating === r.value;
                          return (
                            <button
                              key={r.value}
                              type="button"
                              aria-pressed={on}
                              onClick={() => update("rating", r.value)}
                              style={{
                                padding: "10px 8px", borderRadius: 12, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                                border: on ? "1.5px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
                                backgroundColor: on ? "var(--accent-soft)" : "var(--color-bg-primary)",
                                color: on ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
                                transition: "all 0.15s",
                              }}
                            >
                              <div style={{ fontSize: 14, fontWeight: 700 }}>{r.label}</div>
                              <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2, lineHeight: 1.3 }}>{r.sub}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <OptionToggle
                      label="This is a Short"
                      desc={`Vertical, quick-watch content shown in the Shorts row.${draft.duration != null && draft.duration <= 60 ? " Your video is under a minute, so it qualifies." : ""}`}
                      checked={values.isShort}
                      onChange={(v) => update("isShort", v)}
                    />
                  </div>
                )}

                {tab === "monetization" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-tertiary)" }}>
                      How viewers get access, and how you get paid. All optional.
                    </p>
                    <OptionToggle
                      label="HypeMode (Paid Content)"
                      desc="Your video is gated. Viewers pay to access it. Earns higher revenue share."
                      checked={values.hasPaid}
                      onChange={(v) => update("hasPaid", v)}
                    />
                    <OptionToggle
                      label="List on Marketplace"
                      desc="Buyers can purchase a license or full rights to this video."
                      checked={values.isForSale}
                      onChange={(v) => update("isForSale", v)}
                    />
                    <OptionToggle
                      label="Rent this film"
                      desc="Viewers pay once to watch. They get 30 days to press play, then the window you pick runs from first play."
                      checked={values.isRentable && payoutState === "eligible"}
                      disabled={payoutState !== "eligible"}
                      onChange={(v) => update("isRentable", v)}
                    >
                      {payoutState === "blocked" && (
                        <p style={{ margin: "10px 0 0 28px", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
                          Renting needs a payout account so we can send you the money.{" "}
                          <Link href="/marketplace/dashboard/seller" style={{ color: "var(--color-accent-primary)", fontWeight: 600 }}>
                            Connect payouts
                          </Link>{" "}
                          to enable it.
                        </p>
                      )}
                      {values.isRentable && payoutState === "eligible" && (
                        <div style={{ margin: "14px 0 0 28px" }}>
                          <div role="radiogroup" aria-label="Rental plan" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {RENTAL_PLANS.map((plan) => {
                              const active = values.rentalPriceCents === plan.priceCents;
                              return (
                                <button
                                  key={plan.priceCents}
                                  type="button"
                                  role="radio"
                                  aria-checked={active}
                                  onClick={() => update("rentalPriceCents", plan.priceCents)}
                                  style={{
                                    padding: "10px 18px", borderRadius: 12, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                                    border: active ? "1px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
                                    backgroundColor: active ? "var(--accent-soft)" : "transparent",
                                    color: active ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
                                  }}
                                >
                                  <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>${(plan.priceCents / 100).toFixed(2)}</span>
                                  <span style={{ display: "block", marginTop: 2, fontSize: 12, fontWeight: 600 }}>{plan.label} to watch</span>
                                </button>
                              );
                            })}
                          </div>
                          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
                            You earn ${((rentalPlan.priceCents * (1 - PLATFORM_FEE_RATE)) / 100).toFixed(2)} per rental after the{" "}
                            {Math.round(PLATFORM_FEE_RATE * 100)}% platform fee.
                          </p>
                        </div>
                      )}
                    </OptionToggle>
                  </div>
                )}

                {tab === "visibility" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div role="radiogroup" aria-label="Save or publish" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {([
                        { id: "draft", icon: Lock, title: "Keep as draft", text: "Only you can see it. Everything you change is saved automatically." },
                        { id: "publish", icon: Eye, title: "Public", text: "Everyone can watch once processing finishes." },
                      ] as const).map(({ id, icon: Icon, title, text }) => {
                        const on = intent === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setIntent(id)}
                            style={{
                              display: "flex", gap: 12, textAlign: "left", padding: "16px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
                              border: on ? "1.5px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
                              background: on ? "var(--accent-soft)" : "var(--color-bg-primary)",
                            }}
                          >
                            <Icon size={20} color={on ? "var(--color-accent-primary)" : "var(--color-text-tertiary)"} style={{ flexShrink: 0 }} aria-hidden />
                            <span>
                              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</span>
                              <span style={{ display: "block", marginTop: 3, fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.45 }}>{text}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>Before you publish</p>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                        {checklist.map((item) => (
                          <li key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: item.ok ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                            <span
                              aria-hidden
                              style={{
                                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: item.ok ? "rgba(34,197,94,0.15)" : "var(--color-bg-primary)",
                                border: item.ok ? "none" : "1px solid var(--color-border-secondary)",
                              }}
                            >
                              {item.ok && <Check size={12} color={TONE_COLOR.done} strokeWidth={3} />}
                            </span>
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {!item.ok && item.tab && (
                              <button
                                type="button"
                                onClick={() => changeTab(item.tab!)}
                                style={{ border: "none", background: "none", padding: 0, fontSize: 12, fontWeight: 700, color: "var(--color-accent-primary)", cursor: "pointer", fontFamily: "inherit" }}
                              >
                                Add
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ borderTop: "1px solid var(--color-border-secondary)", paddingTop: 16 }}>
                      <button
                        type="button"
                        onClick={handleDelete}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10,
                          fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: confirmDelete ? "#EF4444" : "rgba(239,68,68,0.08)",
                          color: confirmDelete ? "#fff" : "#EF4444",
                        }}
                      >
                        <Trash2 size={14} aria-hidden />
                        {confirmDelete ? "Click again to delete permanently" : "Delete draft"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right: preview + upload status ───────────────── */}
        <aside className="lg:sticky lg:top-20" style={{ ...card, overflow: "hidden" }}>
          <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#000" }}>
            {videoSrc ? (
              <video
                key={videoSrc}
                src={videoSrc}
                controls
                playsInline
                preload="metadata"
                poster={draft.thumbnail ?? undefined}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.7)" }}>
                {draft.thumbnail
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={draft.thumbnail} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }} />
                  : null}
                <UploadCloud size={30} style={{ position: "relative" }} aria-hidden />
                <span style={{ position: "relative", fontSize: 12.5, fontWeight: 600 }}>
                  {uploadDone ? "Preview available shortly" : "Preview appears when the upload finishes"}
                </span>
              </div>
            )}
          </div>

          <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <FileVideo size={18} color="var(--color-text-tertiary)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {draft.upload.fileName ?? "Video file"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
                  {[
                    draft.upload.fileSize ? formatBytes(draft.upload.fileSize) : null,
                    draft.duration != null ? formatDuration(draft.duration) : null,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            <div style={{ padding: "12px 14px", borderRadius: 14, background: "var(--color-bg-primary)", border: "1px solid var(--color-border-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: toneColor }}>
                  {uploadView.tone === "done" ? <CheckCircle size={15} aria-hidden />
                    : uploadView.tone === "active" ? <Loader2 size={15} className="animate-spin" aria-hidden />
                    : <AlertTriangle size={15} aria-hidden />}
                  {uploadView.tone === "done" ? "Upload complete" : uploadView.tone === "active" ? "Uploading" : uploadView.tone === "error" ? "Upload failed" : "Upload paused"}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: toneColor }}>{uploadView.pct}%</span>
              </div>
              <ProgressBar value={uploadView.pct} />
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.45 }}>
                {uploadView.text}
                {job?.state === "uploading" && job.speedBps > 0 ? ` · ${formatSpeed(job.speedBps)}` : ""}
              </p>

              {(canPause || canResume || uploadView.needsFile) && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {canPause && (
                    <button type="button" onClick={() => uploads.pause(draftId)} style={secondaryBtn}>
                      <Pause size={13} aria-hidden /> Pause
                    </button>
                  )}
                  {canResume && (
                    <button type="button" onClick={() => uploads.resume(draftId)} style={secondaryBtn}>
                      <Play size={13} aria-hidden /> Resume
                    </button>
                  )}
                  {uploadView.needsFile && (
                    <>
                      <button type="button" onClick={() => reselectRef.current?.click()} style={secondaryBtn}>
                        <FileVideo size={13} aria-hidden /> Select file to resume
                      </button>
                      <input
                        ref={reselectRef}
                        type="file"
                        accept={VIDEO_ACCEPT}
                        style={{ display: "none" }}
                        onChange={(e) => { void handleReselect(e.target.files?.[0]); e.target.value = ""; }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {!uploadDone && uploadView.tone !== "error" && (
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
                You can leave this page. The upload keeps going and resumes by itself if your connection drops.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* ── Sticky action bar ──────────────────────────────── */}
      <div
        className="draft-editor-bar"
        style={{
          marginTop: 24,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          padding: "12px 16px",
          background: "var(--color-nav-bg)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          borderTop: "1px solid var(--color-divider)",
          boxShadow: "0 -6px 24px rgba(0,0,0,0.06)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "1 1 200px", minWidth: 0, fontSize: 12.5, fontWeight: 600, color: toneColor }}>
          {uploadView.tone === "done" ? <CheckCircle size={15} aria-hidden /> : <UploadCloud size={15} aria-hidden />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadView.text}</span>
        </span>

        <span className="hidden sm:inline-flex"><SaveIndicator state={saveState} /></span>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button type="button" onClick={() => void handleSaveDraft()} style={{ ...secondaryBtn, padding: "11px 18px", fontSize: 13.5 }}>
            Save draft
          </button>
          {intent === "publish" && (
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing}
              aria-disabled={!canPublish}
              title={firstMissing ? (firstMissing.tab ? `Add a ${firstMissing.label.toLowerCase()} first` : "Available when the upload finishes") : undefined}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 26px", borderRadius: 12, border: "none",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
                color: "var(--color-btn-primary-text, #000)",
                opacity: canPublish && !publishing ? 1 : 0.5,
                cursor: publishing ? "wait" : canPublish ? "pointer" : "not-allowed",
                boxShadow: canPublish ? "0 4px 20px var(--accent-ring)" : "none",
              }}
            >
              {publishing && <Loader2 size={15} className="animate-spin" aria-hidden />}
              {publishing ? "Publishing…" : "Publish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "7px 12px", borderRadius: 10,
  border: "1px solid var(--color-border-secondary)",
  background: "var(--color-bg-elevated)",
  color: "var(--color-text-secondary)",
  fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
};
