"use client";

import { useState, useCallback } from "react";
import emailjs from "emailjs-com";

const CONTENT_TYPES = [
  { value: "video",    label: "Video" },
  { value: "listing",  label: "Marketplace Listing" },
  { value: "user",     label: "User Profile" },
  { value: "comment",  label: "Comment" },
  { value: "blog",     label: "Blog Post" },
  { value: "other",    label: "Other" },
] as const;

const CATEGORIES = [
  { value: "copyright",   label: "Copyright / DMCA Infringement",        danger: true  },
  { value: "spam",        label: "Spam or Misleading Content",            danger: false },
  { value: "harassment",  label: "Harassment or Bullying",                danger: false },
  { value: "hate_speech", label: "Hate Speech or Discrimination",         danger: true  },
  { value: "violence",    label: "Violence or Graphic Content",           danger: true  },
  { value: "adult",       label: "Adult / Sexual Content (Non-Consensual)",danger: true  },
  { value: "fraud",       label: "Fraud, Scam, or Impersonation",         danger: false },
  { value: "privacy",     label: "Privacy Violation (Doxxing / Stalking)", danger: false },
  { value: "csam",        label: "Content Involving Minors (URGENT)",     danger: true  },
  { value: "malware",     label: "Malware or Phishing Link",              danger: true  },
  { value: "other",       label: "Other",                                 danger: false },
] as const;

const EMAILJS = {
  serviceId:  "service_zqol7n4",
  templateId: "template_mdpiipr",
  publicKey:  "1r7HTd-O6zTnCC-J-",
  ownerEmail: "support@wecinema.co",
} as const;

type FormState = {
  contentType: string;
  contentUrl:  string;
  category:    string;
  details:     string;
  reporterEmail: string;
};

const EMPTY: FormState = { contentType: "", contentUrl: "", category: "", details: "", reporterEmail: "" };

export default function ReportContent() {
  const [form,      setForm]      = useState<FormState>(EMPTY);
  const [status,    setStatus]    = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errMsg,    setErrMsg]    = useState("");

  const set = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm((p) => ({ ...p, [field]: e.target.value })),
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.contentType || !form.category || form.details.trim().length < 10) return;

      setStatus("sending");
      setErrMsg("");

      try {
        await emailjs.send(
          EMAILJS.serviceId,
          EMAILJS.templateId,
          {
            content_type:   form.contentType,
            content_url:    form.contentUrl || "Not provided",
            category:       form.category,
            details:        form.details,
            reporter_email: form.reporterEmail || "Anonymous",
            owner_email:    EMAILJS.ownerEmail,
          },
          EMAILJS.publicKey,
        );
        setStatus("success");
        setForm(EMPTY);
      } catch {
        setStatus("error");
        setErrMsg("Failed to submit report. Please try again or email support@wecinema.co directly.");
      }
    },
    [form],
  );

  const fieldBase =
    "w-full px-4 py-2.5 rounded-xl text-sm text-text-primary outline-none transition-all";
  const fieldStyle = {
    border: "1px solid var(--color-input-border)",
    backgroundColor: "var(--color-input-bg)",
  };
  const focusHandlers = {
    onFocus:  (e: React.FocusEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent-primary)";
      (e.currentTarget as HTMLElement).style.boxShadow  = "0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 18%, transparent)";
    },
    onBlur:   (e: React.FocusEvent<HTMLElement>) => {
      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-input-border)";
      (e.currentTarget as HTMLElement).style.boxShadow  = "none";
    },
  };

  const selectedCategory = CATEGORIES.find((c) => c.value === form.category);
  const isUrgent = selectedCategory?.danger;

  if (status === "success") {
    return (
      <div className="min-h-screen bg-bg-primary px-4 py-16 flex justify-center items-start">
        <div
          className="w-full max-w-[520px] rounded-[20px] border border-border-secondary p-10 text-center"
          style={{ backgroundColor: "var(--color-bg-elevated)", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "var(--color-success-bg)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Report Submitted
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            Thank you for helping keep WeCinema safe. Our moderation team will review your report and take appropriate action within 24–72 hours.
          </p>
          {form.category !== "csam" && (
            <p className="text-[12.5px] text-text-tertiary mb-6">
              For urgent safety issues, contact us directly at{" "}
              <a href="mailto:support@wecinema.co" className="text-accent-primary hover:underline">support@wecinema.co</a>
            </p>
          )}
          <button
            onClick={() => setStatus("idle")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--color-accent-primary)", color: "#000" }}
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-10 flex justify-center items-start">
      <div
        className="w-full max-w-[560px] rounded-[20px] border border-border-secondary overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-elevated)", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-divider" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--color-danger-bg)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                Report Content
              </h1>
              <p className="text-[12.5px] text-text-tertiary">Help us keep WeCinema safe and trustworthy.</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-7">
          {/* CSAM urgent notice */}
          {form.category === "csam" && (
            <div className="px-4 py-3.5 rounded-xl text-[13px] font-medium leading-relaxed mb-5 border"
              style={{ backgroundColor: "var(--color-danger-bg)", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}>
              <strong>URGENT:</strong> Content involving minors is treated as the highest priority. Your report is transmitted immediately. You may also contact the NCMEC at{" "}
              <a href="https://www.missingkids.org/gethelpnow/cybertipline" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                CyberTipline.org
              </a>
              {" "}or call 1-800-843-5678.
            </div>
          )}

          {isUrgent && form.category !== "csam" && (
            <div className="px-4 py-3 rounded-xl text-[13px] mb-4 border"
              style={{ backgroundColor: "var(--color-warning-bg)", borderColor: "var(--color-warning)", color: "var(--color-text-secondary)" }}>
              <strong>High priority category</strong>: our moderation team reviews these reports within 24 hours.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Content Type */}
            <div>
              <label className="block text-[12.5px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                What are you reporting? <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, contentType: ct.value }))}
                    className="py-2.5 px-3 rounded-xl text-[12.5px] font-medium text-center transition-all border"
                    style={{
                      borderColor:     form.contentType === ct.value ? "var(--color-accent-primary)" : "var(--color-border-secondary)",
                      backgroundColor: form.contentType === ct.value ? "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)" : "var(--color-bg-secondary)",
                      color:           form.contentType === ct.value ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
                    }}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content URL */}
            <div>
              <label htmlFor="content-url" className="block text-[12.5px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                URL of the Content
              </label>
              <input
                id="content-url"
                type="url"
                value={form.contentUrl}
                onChange={set("contentUrl")}
                placeholder="https://wecinema.co/watch/..."
                className={`${fieldBase} appearance-none`}
                style={fieldStyle}
                {...focusHandlers}
              />
              <p className="text-[11.5px] text-text-tertiary mt-1">Paste the direct link to the content you&apos;re reporting.</p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="report-category" className="block text-[12.5px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                Reason for Report <span className="text-danger">*</span>
              </label>
              <select
                id="report-category"
                value={form.category}
                onChange={set("category")}
                required
                className={`${fieldBase} appearance-none`}
                style={{
                  ...fieldStyle,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' fill='none' stroke='%23909090' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  paddingRight: "40px",
                }}
                {...focusHandlers}
              >
                <option value="">Select a reason…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Details */}
            <div>
              <label htmlFor="report-details" className="block text-[12.5px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                Additional Details <span className="text-danger">*</span>
              </label>
              <textarea
                id="report-details"
                value={form.details}
                onChange={set("details")}
                placeholder="Please describe what you saw and why it violates our policies. Include timestamps, usernames, or any other relevant context…"
                className={`${fieldBase} resize-y min-h-[130px] leading-relaxed`}
                style={fieldStyle}
                minLength={10}
                required
                {...focusHandlers}
              />
              <p className="text-[11.5px] text-text-tertiary mt-1">Minimum 10 characters. More detail helps our team act faster.</p>
            </div>

            {/* Reporter email (optional) */}
            <div>
              <label htmlFor="reporter-email" className="block text-[12.5px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                Your Email <span className="text-text-tertiary font-normal">(optional, for follow-up)</span>
              </label>
              <input
                id="reporter-email"
                type="email"
                value={form.reporterEmail}
                onChange={set("reporterEmail")}
                placeholder="you@example.com"
                className={`${fieldBase}`}
                style={fieldStyle}
                {...focusHandlers}
              />
              <p className="text-[11.5px] text-text-tertiary mt-1">Only used if we need clarification. Not required.</p>
            </div>

            {/* Error */}
            {status === "error" && (
              <div className="px-4 py-3 rounded-xl text-[13px] font-medium text-center border"
                style={{ backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", borderColor: "color-mix(in srgb, var(--color-danger) 20%, transparent)" }}>
                {errMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "sending" || !form.contentType || !form.category || form.details.trim().length < 10}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              style={{ backgroundColor: isUrgent ? "var(--color-danger)" : "var(--color-accent-primary)", color: isUrgent ? "#fff" : "#000" }}
            >
              {status === "sending" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Submitting…
                </span>
              ) : isUrgent ? "Submit Urgent Report" : "Submit Report"}
            </button>

            <p className="text-center text-[11.5px] text-text-tertiary leading-relaxed">
              By submitting, you confirm this report is made in good faith. False or malicious reports may result in account action.{" "}
              <a href="/privacy-policy" className="text-accent-primary hover:underline">Privacy Policy</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
