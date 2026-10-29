"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlignLeft, CheckCircle, ClipboardCheck, FileText, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import { UploadWizard, type WizardStep } from "@/features/upload/components/UploadWizard";
import {
  FieldLabel, MultiSelect, PageHero, ReviewRow, TipCard, inputStyle,
} from "@/features/upload/components/UploadUI";

// ── Constants ─────────────────────────────────────────────────

const GENRES = [
  "Action", "Adventure", "Comedy", "Documentary",
  "Drama", "Horror", "Love", "Mystery", "Romance", "Thriller",
];

const FORMAT_TIPS = [
  "Use standard screenplay format: scene headings, action, character names, dialogue.",
  "Scene headings: INT./EXT. LOCATION - DAY/NIGHT",
  "Character names are centered in ALL CAPS before their dialogue.",
  "Action lines describe what we see: keep them tight and visual.",
  "Dialogue should reveal character, not exposition.",
];

const STRUCTURE_TIPS = [
  "Act 1 (pages 1–25): Setup (introduce world, protagonist, and inciting incident).",
  "Act 2 (pages 25–85): Confrontation (rising stakes, midpoint, dark night of the soul).",
  "Act 3 (pages 85–110): Resolution (climax, denouement).",
  "Aim for one page = one minute of screen time.",
  "Feature films: 90–120 pages. Short films: 5–15 pages.",
];

const MARKETPLACE_TIPS = [
  "Clear, professional formatting increases buyer confidence.",
  "Add a logline summary in the description for better discoverability.",
  "Genre tags connect your script to interested buyers and producers.",
  "Buyers look for scripts with strong voice: let your style shine.",
];

const PLACEHOLDER = `FADE IN:

INT. LOCATION - DAY

Describe the scene here. Keep action lines brief and visual.

\t\t\t\tCHARACTER NAME
\t\t\tDialogue goes here.

EXT. ANOTHER LOCATION - NIGHT

The story continues...`;

// ── Page ──────────────────────────────────────────────────────

export default function UploadScriptPage() {
  const router = useRouter();
  const { status } = useAuth();

  const [step, setStep] = useState(0);
  const [title, setTitle]       = useState("");
  const [genres, setGenres]     = useState<string[]>([]);
  const [content, setContent]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  // One script page runs ~185 words. Anything written at all is at least a
  // page — rounding a short scene down to "~0 pages" reads like a bug.
  const pageEst   = wordCount ? Math.max(1, Math.round(wordCount / 185)) : 0;
  const lengthLabel =
    pageEst >= 85 && pageEst <= 120 ? "Feature length"
    : pageEst > 120 ? "Over feature length"
    : pageEst > 0 ? "Short / Mid-length"
    : "-";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post("/video/scripts", {
        title: title.trim(),
        genre: genres,
        script: content,
      } as Record<string, unknown>);
      setDone(true);
      toast.success("Script uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(false);
    setStep(0);
    setTitle("");
    setGenres([]);
    setContent("");
  };

  // ── Steps ─────────────────────────────────────────────────

  const steps: WizardStep[] = useMemo(() => [
    {
      id: "details",
      title: "Details",
      hint: "Name your screenplay and tag it so buyers can find it.",
      icon: Tag,
      aside: <TipCard title="Marketplace Tips" items={MARKETPLACE_TIPS} />,
      validate: () =>
        !title.trim() ? "A title is required to continue"
        : genres.length === 0 ? "Select at least one genre to continue"
        : null,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <FieldLabel required>Title</FieldLabel>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Last Signal, Broken Roads, A Quiet Light..."
              maxLength={120}
              style={inputStyle}
            />
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "right" }}>
              {title.length}/120
            </p>
          </div>
          <div>
            <FieldLabel required>Genre</FieldLabel>
            <MultiSelect options={GENRES} value={genres} onChange={setGenres} />
          </div>
        </div>
      ),
    },
    {
      id: "screenplay",
      title: "Screenplay",
      hint: "Write or paste your script. HTML is supported for basic formatting.",
      icon: AlignLeft,
      aside: <TipCard title="Formatting Tips" items={FORMAT_TIPS} />,
      validate: () => (!content.trim() ? "Add your screenplay to continue" : null),
      content: (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
            <FieldLabel required>Script Content</FieldLabel>
            <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                {wordCount.toLocaleString()} words
              </span>
              {pageEst > 0 && (
                <span style={{ fontSize: 11, color: "var(--color-accent-primary)", fontWeight: 600 }}>
                  ~{pageEst} page{pageEst !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={24}
            placeholder={PLACEHOLDER}
            style={{
              ...inputStyle,
              padding: "18px 20px",
              fontSize: 13.5,
              resize: "vertical",
              fontFamily: "'Courier New', Courier, monospace",
              lineHeight: 1.85,
              minHeight: 420,
            }}
          />
          {/* Bottom stats bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 8,
              padding: "8px 12px",
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-border-secondary)",
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {content.length.toLocaleString()} characters
            </span>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {wordCount.toLocaleString()} words · ~{pageEst} pages
              {pageEst >= 85 && pageEst <= 120 && (
                <span style={{ color: "rgb(74,222,128)", marginLeft: 6 }}>✓ Feature length</span>
              )}
              {pageEst > 0 && pageEst < 85 && (
                <span style={{ color: "rgb(251,191,36)", marginLeft: 6 }}>Short / Mid-length</span>
              )}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "review",
      title: "Review",
      hint: "One last look before it goes live on the marketplace.",
      icon: ClipboardCheck,
      aside: <TipCard title="Script Structure" items={STRUCTURE_TIPS} />,
      content: (
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
            {title.trim() || "Untitled"}
          </h3>

          <div style={{ marginTop: 16 }}>
            <ReviewRow label="Genre">{genres.length ? genres.join(", ") : "-"}</ReviewRow>
            <ReviewRow label="Length">
              {wordCount.toLocaleString()} words · ~{pageEst} page{pageEst !== 1 ? "s" : ""} · {lengthLabel}
            </ReviewRow>
            <ReviewRow label="Opening">
              <pre
                style={{
                  margin: 0,
                  maxHeight: 200,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "var(--color-text-secondary)",
                  padding: "12px 14px",
                  backgroundColor: "var(--color-bg-primary)",
                  border: "1px solid var(--color-border-secondary)",
                  borderRadius: 10,
                }}
              >
                {content.trim().slice(0, 600) || "-"}
                {content.trim().length > 600 ? "\n…" : ""}
              </pre>
            </ReviewRow>
          </div>
        </div>
      ),
    },
  ], [title, genres, content, wordCount, pageEst, lengthLabel]);

  // ── Success screen ────────────────────────────────────────

  if (done) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
        <div
          style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(74,222,128,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle style={{ width: 44, height: 44, color: "rgb(74,222,128)" }} />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "var(--color-text-primary)" }}>
          Script Published!
        </h2>
        <p style={{ margin: "0 0 32px", fontSize: 14, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
          Your screenplay is now live on WeCinema and visible to buyers and producers.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => router.push("/scripts")}
            style={{
              padding: "11px 28px",
              background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
              color: "var(--color-btn-primary-text, #000)",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Browse Scripts
          </button>
          <button
            onClick={reset}
            style={{
              padding: "11px 28px",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid var(--color-border-secondary)",
              cursor: "pointer",
            }}
          >
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 16px 64px" }}>
      <PageHero
        icon={FileText}
        crumb="Upload Script"
        heading="Upload Your Screenplay"
        sub="Share your script with producers, studios, and buyers worldwide"
      />

      <UploadWizard
        steps={steps}
        index={step}
        onIndexChange={setStep}
        onSubmit={handleSubmit}
        submitLabel="Publish Script"
        submitIcon={FileText}
        submitting={submitting}
        submittingLabel="Publishing…"
      />
    </div>
  );
}
