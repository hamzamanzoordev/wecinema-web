"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hash, Loader2, X } from "lucide-react";
import { api } from "@/features/auth/services/apiClient";
import {
  MAX_TAGS, TAGS_MAX_TOTAL_CHARS, TAG_MAX_LENGTH,
  addTag, cleanTag, displayTag, slugifyTag, splitTagInput, tagsCharsUsed,
} from "@/lib/tags";

/**
 * Tag box for the upload form — YouTube's tag field and TikTok's hashtag
 * picker in one control.
 *
 * Enter, Tab, comma and space all commit the word being typed (space commits
 * only while the entry looks like a hashtag, so "found footage" can still be
 * typed as one tag). Backspace on an empty box edits the last chip back into
 * the input rather than deleting it outright. Suggestions come from tags other
 * creators already use, which is what keeps a tag vocabulary from fragmenting.
 */

interface Suggestion {
  tag: string;
  label: string;
  count: number;
}

const REJECTION_TEXT: Record<string, string> = {
  "too-short": `Tags need at least 2 letters or numbers`,
  duplicate: "You already added that tag",
  "max-tags": `You can add up to ${MAX_TAGS} tags`,
  "no-room": `That would go over the ${TAGS_MAX_TOTAL_CHARS}-character limit`,
};

export function TagsInput({
  value,
  onChange,
  /** Hashtags found in the description — shown as already-counted, not editable here. */
  inherited = [],
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  inherited?: string[];
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const charsUsed = tagsCharsUsed(value);
  const full = value.length >= MAX_TAGS;

  // Tags the creator typed into the description. They count toward the limit
  // on the server, so showing them here stops the count looking wrong.
  const extra = useMemo(() => {
    const have = new Set(value.map(slugifyTag));
    return inherited.filter((t) => !have.has(slugifyTag(t)));
  }, [inherited, value]);

  const commit = useCallback(
    (raw: string): boolean => {
      let next = value;
      let rejected: string | null = null;

      // A paste can carry several tags at once.
      for (const part of splitTagInput(raw)) {
        for (const word of part.startsWith("#") ? part.split(/\s+(?=#)/) : [part]) {
          const result = addTag(next, word);
          next = result.tags;
          if (result.rejected && result.rejected !== "empty") rejected = result.rejected;
        }
      }

      if (next !== value) onChange(next);
      setError(rejected ? REJECTION_TEXT[rejected] ?? null : null);
      return next !== value;
    },
    [onChange, value],
  );

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
    setError(null);
  };

  // ── Suggestions ───────────────────────────────────────────
  useEffect(() => {
    const term = cleanTag(draft);
    if (!open) return;

    let cancelled = false;
    setLoadingSuggestions(true);
    const timer = setTimeout(() => {
      api
        .get<{ suggestions?: Suggestion[] }>(
          `/video/tags/suggest?q=${encodeURIComponent(term)}`,
        )
        .then((res) => {
          if (cancelled) return;
          const have = new Set(value.map(slugifyTag));
          setSuggestions((res.suggestions ?? []).filter((s) => !have.has(s.tag)).slice(0, 8));
        })
        .catch(() => { if (!cancelled) setSuggestions([]); })
        .finally(() => { if (!cancelled) setLoadingSuggestions(false); });
    }, 200);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [draft, open, value]);

  // Close the suggestion list on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => setHighlight(-1), [suggestions]);

  const pickSuggestion = (s: Suggestion) => {
    commit(s.label || s.tag);
    setDraft("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && suggestions.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setHighlight((h) => {
        const n = suggestions.length;
        return e.key === "ArrowDown" ? (h + 1) % n : (h - 1 + n) % n;
      });
      return;
    }

    if (e.key === "Escape") { setOpen(false); return; }

    // Space commits a hashtag-shaped entry ("#horror ") but not a phrase the
    // creator is still typing ("found footage").
    const isSeparator =
      e.key === "Enter" ||
      e.key === "Tab" ||
      e.key === "," ||
      (e.key === " " && draft.trim().startsWith("#"));

    if (isSeparator) {
      if (highlight >= 0 && suggestions[highlight]) {
        e.preventDefault();
        pickSuggestion(suggestions[highlight]);
        return;
      }
      if (!draft.trim()) return;
      // Tab still moves focus when there is nothing to commit.
      e.preventDefault();
      commit(draft);
      setDraft("");
      return;
    }

    if (e.key === "Backspace" && !draft && value.length) {
      e.preventDefault();
      const last = value[value.length - 1];
      onChange(value.slice(0, -1));
      setDraft(last ?? "");
      setError(null);
    }
  };

  const showList = open && (loadingSuggestions || suggestions.length > 0);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 7,
          minHeight: 46,
          padding: "9px 12px",
          backgroundColor: "var(--color-bg-primary)",
          border: "1px solid var(--color-border-secondary)",
          borderRadius: 12,
          cursor: "text",
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 6px 5px 11px",
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 9999,
              border: "1px solid var(--color-accent-primary)",
              backgroundColor: "var(--accent-soft)",
              color: "var(--color-accent-primary)",
              maxWidth: "100%",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{displayTag(tag)}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(tag); }}
              aria-label={`Remove tag ${tag}`}
              style={{
                display: "inline-flex",
                padding: 2,
                border: "none",
                background: "none",
                color: "inherit",
                cursor: "pointer",
                opacity: 0.7,
              }}
            >
              <X size={12} aria-hidden />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={draft}
          disabled={full}
          maxLength={TAG_MAX_LENGTH + 1}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setDraft(e.target.value); setError(null); setOpen(true); }}
          onKeyDown={onKeyDown}
          onBlur={() => { if (draft.trim()) { commit(draft); setDraft(""); } }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (!/[,\n]/.test(text)) return;
            e.preventDefault();
            commit(text);
            setDraft("");
          }}
          placeholder={
            full
              ? `Tag limit reached (${MAX_TAGS})`
              : value.length
                ? "Add another…"
                : "Add tags, try #horror, #shortfilm, found footage"
          }
          aria-label="Tags"
          style={{
            flex: "1 1 140px",
            minWidth: 140,
            padding: "4px 2px",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--color-text-primary)",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
      </div>

      {showList && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 30,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            margin: 0,
            padding: 6,
            listStyle: "none",
            maxHeight: 260,
            overflowY: "auto",
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-secondary)",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
          }}
        >
          {loadingSuggestions && suggestions.length === 0 && (
            <li style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", fontSize: 13, color: "var(--color-text-tertiary)" }}>
              <Loader2 size={13} className="animate-spin" aria-hidden /> Finding tags…
            </li>
          )}
          {suggestions.map((s, i) => (
            <li key={s.tag}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickSuggestion(s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "9px 10px",
                  border: "none",
                  borderRadius: 8,
                  background: i === highlight ? "var(--accent-soft)" : "transparent",
                  color: "var(--color-text-primary)",
                  fontSize: 13.5,
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <Hash size={13} style={{ color: "var(--color-accent-primary)", flexShrink: 0 }} aria-hidden />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.label || s.tag}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--color-text-tertiary)", flexShrink: 0 }}>
                  {s.count.toLocaleString()} video{s.count === 1 ? "" : "s"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          margin: "6px 2px 0",
          fontSize: 11.5,
          color: error ? "rgb(248,113,113)" : "var(--color-text-tertiary)",
        }}
      >
        <span>
          {error ??
            "Press Enter or comma to add. Tags help viewers find your video in search and on hashtag pages."}
        </span>
        <span style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
          {value.length}/{MAX_TAGS} · {charsUsed}/{TAGS_MAX_TOTAL_CHARS}
        </span>
      </div>

      {extra.length > 0 && (
        <p style={{ margin: "8px 2px 0", fontSize: 11.5, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
          Also added from your description on publish:{" "}
          <span style={{ color: "var(--color-accent-primary)", fontWeight: 600 }}>
            {extra.map((t) => displayTag(t)).join(" ")}
          </span>
        </p>
      )}
    </div>
  );
}
