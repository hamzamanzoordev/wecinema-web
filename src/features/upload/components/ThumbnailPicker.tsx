"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Film, ImageIcon, ImageUp, Loader2, RefreshCw, Sparkles, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { DropZone, formatDuration, useObjectUrl } from "@/features/upload/components/UploadUI";
import {
  FrameCaptureError,
  bestCandidateIndex,
  captureFrame,
  detectThumbnailCandidates,
  frameToFile,
  seekTo,
  type FrameCandidate,
} from "@/features/upload/lib/videoFrames";

type Tab = "suggested" | "frame" | "upload";

/**
 * Where the selected thumbnail came from. Frames remember their video so a
 * swapped video invalidates them; gallery images don't depend on the video.
 */
type Origin =
  | { kind: "auto" | "frame"; time: number; src: string }
  | { kind: "gallery"; name: string };

/** Scan results are tagged with the video (and rescan) they belong to. */
interface ScanState {
  id: string | null;
  candidates: FrameCandidate[];
  error: string;
  done: boolean;
}

const IDLE_SCAN: ScanState = { id: null, candidates: [], error: "", done: false };
const CANDIDATE_COUNT = 8;
const FRAME_STEP = 1 / 30;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function frameErrorMessage(err: unknown) {
  if (err instanceof FrameCaptureError && err.reason === "cors") {
    return "Couldn't read frames from this video. Upload an image instead.";
  }
  return "Your browser can't read frames from this video format. Upload an image instead.";
}

/**
 * Thumbnail chooser with three sources:
 *  - Suggested:  frames sampled across the video, best-looking one highlighted
 *  - Pick frame: scrub to any moment and grab it
 *  - Upload:     an image from the device / photo gallery
 *
 * `value` is the chosen image as a File, ready for uploadDirectToS3("thumbnail").
 * `currentUrl` is shown while nothing new is picked (editing a video).
 * `autoSelect` scans as soon as a video is present and fills in the best frame.
 */
export function ThumbnailPicker({
  videoSrc,
  value,
  onChange,
  currentUrl,
  autoSelect = false,
}: {
  videoSrc?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  currentUrl?: string;
  autoSelect?: boolean;
}) {
  // null = no explicit choice: Suggested when there's a video, Upload otherwise.
  const [pickedTab, setPickedTab] = useState<Tab | null>(null);
  const tab: Tab = !videoSrc ? "upload" : pickedTab ?? "suggested";

  const [origin, setOrigin] = useState<Origin | null>(null);
  const liveOrigin = origin && (origin.kind === "gallery" || origin.src === videoSrc) ? origin : null;

  const [scanKey, setScanKey] = useState(0);
  const [scanState, setScanState] = useState<ScanState>(IDLE_SCAN);
  const scanId = videoSrc ? `${videoSrc}#${scanKey}` : null;
  const scan = scanState.id === scanId ? scanState : IDLE_SCAN;
  const wantScan = !!scanId && (tab === "suggested" || (autoSelect && !value));
  const scanning = wantScan && !scan.done;

  // Latest props for async callbacks, so a slow scan can't overwrite
  // something the creator picked while it was running.
  const valueRef = useRef(value);
  const originRef = useRef(origin);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = value;
    originRef.current = origin;
    onChangeRef.current = onChange;
  });

  const previewUrl = useObjectUrl(value);
  const candidateUrls = useMemo(
    () => scan.candidates.map((c) => URL.createObjectURL(c.blob)),
    [scan.candidates],
  );
  useEffect(() => () => candidateUrls.forEach((u) => URL.revokeObjectURL(u)), [candidateUrls]);
  const best = bestCandidateIndex(scan.candidates);

  const select = (file: File | null, next: Origin | null) => {
    setOrigin(next);
    onChange(file);
  };

  // A new (or removed) video invalidates a frame picked from the old one.
  useEffect(() => {
    const o = originRef.current;
    if (o && o.kind !== "gallery" && o.src !== videoSrc && valueRef.current) {
      onChangeRef.current(null);
    }
  }, [videoSrc]);

  const scanDone = scan.done;
  useEffect(() => {
    if (!videoSrc || !scanId || !wantScan || scanDone) return;
    const controller = new AbortController();

    detectThumbnailCandidates(videoSrc, {
      count: CANDIDATE_COUNT,
      signal: controller.signal,
      onProgress: (candidates) => setScanState({ id: scanId, candidates, error: "", done: false }),
    })
      .then((found) => {
        setScanState({ id: scanId, candidates: found, error: "", done: true });
        const pick = found[bestCandidateIndex(found)];
        if (autoSelect && pick && !valueRef.current) {
          setOrigin({ kind: "auto", time: pick.time, src: videoSrc });
          onChangeRef.current(frameToFile(pick.blob, pick.time));
        }
      })
      .catch((err) => {
        if (err instanceof FrameCaptureError && err.reason === "aborted") return;
        setScanState({ id: scanId, candidates: [], error: frameErrorMessage(err), done: true });
      });

    return () => controller.abort();
  }, [videoSrc, scanId, wantScan, scanDone, autoSelect]);

  const handleGalleryFile = (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (f.size > MAX_IMAGE_BYTES) { toast.error("Image must be under 10 MB"); return; }
    select(f, { kind: "gallery", name: f.name });
  };

  const selectedTime = liveOrigin && liveOrigin.kind !== "gallery" && value ? liveOrigin.time : null;

  const caption = !value
    ? currentUrl ? "Current thumbnail" : "No thumbnail selected"
    : liveOrigin?.kind === "auto" ? `Frame at ${formatDuration(liveOrigin.time)}`
    : liveOrigin?.kind === "frame" ? `Frame at ${formatDuration(liveOrigin.time)}`
    : liveOrigin?.kind === "gallery" ? `Uploaded: ${liveOrigin.name}`
    : value.name;

  const shownUrl = previewUrl ?? currentUrl;

  const tabs: { id: Tab; label: string; icon: React.ElementType; disabled: boolean }[] = [
    { id: "suggested", label: "Suggested",  icon: Sparkles, disabled: !videoSrc },
    { id: "frame",     label: "Pick frame", icon: Film,     disabled: !videoSrc },
    { id: "upload",    label: "Upload",     icon: ImageUp,  disabled: false },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Selected thumbnail */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-border-secondary)" }}>
        <div
          style={{
            aspectRatio: "16 / 9", backgroundColor: "#000",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {shownUrl ? (
            // Blob / signed URL preview — next/image would proxy it pointlessly.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownUrl} alt="Thumbnail preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : scanning && autoSelect ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} aria-hidden />
              Finding the best frame…
            </span>
          ) : (
            <ImageIcon style={{ width: 26, height: 26, color: "rgba(255,255,255,0.35)" }} aria-hidden />
          )}
        </div>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
            backgroundColor: "var(--color-bg-elevated)", borderTop: "1px solid var(--color-border-secondary)",
          }}
        >
          {liveOrigin?.kind === "auto" && value && (
            <Sparkles style={{ width: 13, height: 13, color: "var(--color-accent-primary)", flexShrink: 0 }} aria-hidden />
          )}
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {caption}
          </span>
          {value && (
            <button
              type="button"
              onClick={() => select(null, null)}
              aria-label={currentUrl ? "Keep current thumbnail" : "Remove thumbnail"}
              title={currentUrl ? "Keep current thumbnail" : "Remove thumbnail"}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", padding: 0 }}
            >
              <X style={{ width: 15, height: 15 }} aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Source tabs */}
      <div role="tablist" aria-label="Thumbnail source" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tabs.map(({ id, label, icon: Icon, disabled }) => {
          const on = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={disabled}
              onClick={() => setPickedTab(id)}
              title={disabled ? "Add a video first" : undefined}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 13px", borderRadius: 9999, fontSize: 12,
                fontWeight: on ? 600 : 500,
                border: on ? "1px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
                backgroundColor: on ? "var(--accent-soft)" : "transparent",
                color: on ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Icon style={{ width: 13, height: 13 }} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      {/* Suggested frames */}
      {tab === "suggested" && videoSrc && (
        <div role="tabpanel">
          {scan.error ? (
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
              {scan.error}{" "}
              <button
                type="button"
                onClick={() => setPickedTab("upload")}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--color-accent-primary)", fontWeight: 600, fontSize: 12 }}
              >
                Upload an image
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                  {scanning
                    ? `Scanning video… ${scan.candidates.length}/${CANDIDATE_COUNT}`
                    : "Frames from across your video. Tap one to use it."}
                </span>
                {!scanning && scan.candidates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScanKey((k) => k + 1)}
                    aria-label="Rescan video"
                    title="Rescan video"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", padding: 0 }}
                  >
                    <RefreshCw style={{ width: 14, height: 14 }} aria-hidden />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: CANDIDATE_COUNT }, (_, i) => {
                  const c = scan.candidates[i];
                  if (!c) {
                    return (
                      <div
                        key={`slot-${i}`}
                        className={scanning ? "animate-pulse" : undefined}
                        style={{ aspectRatio: "16 / 9", borderRadius: 10, backgroundColor: "var(--color-bg-secondary, rgba(127,127,127,0.15))" }}
                      />
                    );
                  }
                  const on = selectedTime !== null && Math.abs(selectedTime - c.time) < 0.01;
                  return (
                    <button
                      key={`frame-${i}`}
                      type="button"
                      onClick={() => select(frameToFile(c.blob, c.time), { kind: "auto", time: c.time, src: videoSrc })}
                      aria-pressed={on}
                      aria-label={`Use frame at ${formatDuration(c.time)}`}
                      style={{
                        position: "relative", padding: 0, borderRadius: 10, overflow: "hidden",
                        aspectRatio: "16 / 9", backgroundColor: "#000", cursor: "pointer",
                        border: on ? "2px solid var(--color-accent-primary)" : "2px solid transparent",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={candidateUrls[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <span style={{ position: "absolute", right: 4, bottom: 4, padding: "1px 5px", borderRadius: 4, fontSize: 10, fontWeight: 600, color: "#fff", backgroundColor: "rgba(0,0,0,0.65)" }}>
                        {formatDuration(c.time)}
                      </span>
                      {!scanning && i === best && (
                        <span style={{ position: "absolute", left: 4, top: 4, display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "var(--color-btn-primary-text, #000)", backgroundColor: "var(--color-accent-primary)" }}>
                          <Sparkles style={{ width: 9, height: 9 }} aria-hidden /> Best
                        </span>
                      )}
                      {on && (
                        <span style={{ position: "absolute", right: 4, top: 4, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-accent-primary)" }}>
                          <Check style={{ width: 12, height: 12, color: "var(--color-btn-primary-text, #000)" }} aria-hidden />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Scrub to a frame — keyed by video so its state resets on a swap */}
      {tab === "frame" && videoSrc && (
        <FrameScrubber
          key={videoSrc}
          src={videoSrc}
          startAt={selectedTime ?? 0}
          onCapture={(blob, time) => {
            select(frameToFile(blob, time), { kind: "frame", time, src: videoSrc });
            toast.success(`Thumbnail set to frame at ${formatDuration(time)}`);
          }}
        />
      )}

      {/* Upload from device / gallery */}
      {tab === "upload" && (
        <div role="tabpanel">
          <DropZone
            accept="image/*"
            file={liveOrigin?.kind === "gallery" ? value : null}
            onFile={handleGalleryFile}
            onClear={() => select(null, null)}
            icon={ImageUp}
            label="Drop an image here or choose from your gallery"
            hint="JPG, PNG, WebP · Max 10 MB · Auto-converted to WebP · 16:9 looks best"
          />
        </div>
      )}
    </div>
  );
}

/** Video with a scrub bar and frame-step buttons; captures the frame on screen. */
function FrameScrubber({
  src,
  startAt,
  onCapture,
}: {
  src: string;
  startAt: number;
  onCapture: (blob: Blob, time: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(startAt);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [grabbing, setGrabbing] = useState(false);

  const scrubTo = (t: number) => {
    const v = ref.current;
    if (!v || !duration) return;
    const clamped = Math.max(0, Math.min(t, duration));
    setTime(clamped);
    v.currentTime = clamped;
  };

  const grab = async () => {
    const v = ref.current;
    if (!v) return;
    setGrabbing(true);
    try {
      await seekTo(v, time);
      onCapture(await captureFrame(v), v.currentTime);
    } catch (err) {
      toast.error(frameErrorMessage(err));
    } finally {
      setGrabbing(false);
    }
  };

  const steps = [
    { label: "1s", delta: -1,          title: "Back 1 second" },
    { label: "1f", delta: -FRAME_STEP, title: "Back 1 frame" },
    { label: "1f", delta: FRAME_STEP,  title: "Forward 1 frame" },
    { label: "1s", delta: 1,           title: "Forward 1 second" },
  ];
  const canGrab = ready && !grabbing;

  return (
    <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <video
        ref={ref}
        src={src}
        crossOrigin="anonymous"
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : 0);
          // Start on the current pick, so fine-tuning it is one nudge away.
          e.currentTarget.currentTime = startAt;
        }}
        onLoadedData={() => setReady(true)}
        onError={() => toast.error(frameErrorMessage(null))}
        style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "contain", backgroundColor: "#000", borderRadius: 12 }}
      />
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={time}
        disabled={!duration}
        onChange={(e) => scrubTo(Number(e.target.value))}
        aria-label="Scrub video"
        style={{ width: "100%", accentColor: "var(--color-accent-primary)" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {steps.map(({ label, delta, title }) => (
          <button
            key={title}
            type="button"
            onClick={() => scrubTo(time + delta)}
            disabled={!duration}
            aria-label={title}
            title={title}
            style={{
              display: "inline-flex", alignItems: "center", gap: 1,
              padding: "5px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              border: "1px solid var(--color-border-secondary)", backgroundColor: "transparent",
              color: "var(--color-text-secondary)", cursor: duration ? "pointer" : "not-allowed",
            }}
          >
            {delta < 0 && <ChevronLeft style={{ width: 12, height: 12 }} aria-hidden />}
            {label}
            {delta > 0 && <ChevronRight style={{ width: 12, height: 12 }} aria-hidden />}
          </button>
        ))}
        <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: "var(--color-text-tertiary)", marginLeft: 4 }}>
          {formatDuration(time)} / {formatDuration(duration)}
        </span>
        <button
          type="button"
          onClick={grab}
          disabled={!canGrab}
          style={{
            marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 700,
            background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
            color: "var(--color-btn-primary-text, #000)",
            cursor: canGrab ? "pointer" : "not-allowed",
            opacity: canGrab ? 1 : 0.6,
          }}
        >
          {grabbing
            ? <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} aria-hidden />
            : <Check style={{ width: 13, height: 13 }} aria-hidden />}
          Use this frame
        </button>
      </div>
    </div>
  );
}
