/**
 * Seasonal Halloween decorations. Always rendered, but hidden unless the root
 * <html> has data-season="halloween" (set pre-paint in app/layout.tsx), so the
 * season check never causes a hydration mismatch. Styles live in globals.css
 * under "Halloween season".
 */

const BAT_PATH =
  "M12 6c.6-1 1.2-1.4 1.6-1.4l.3 1.6c.9-.5 2.6-.4 4 .3 1.6.8 3.2 2.3 4.1 4.2-1.2-.6-2.4-.6-3.2 0-.8-.8-2.2-1-3.1-.3-.6-.6-1.6-.8-2.4-.3-.4.6-.9 1.3-1.3 2.2-.4-.9-.9-1.6-1.3-2.2-.8-.5-1.8-.3-2.4.3-.9-.7-2.3-.5-3.1.3-.8-.6-2-.6-3.2 0 .9-1.9 2.5-3.4 4.1-4.2 1.4-.7 3.1-.8 4-.3l.3-1.6c.4 0 1 .4 1.6 1.4z";

/** Small witch hat that sits on top of the header logo. */
export function WitchHat() {
  return (
    <svg className="hw-only hw-hat" viewBox="0 0 32 28" width={22} height={19} aria-hidden="true">
      <path d="M17 1c-3 2-6 9-8 18h14c-1-4-2-8-1-11 1-2 3-3 5-3-3-3-7-5-10-4z" fill="#2B1740" />
      <rect x="9.5" y="15.5" width="13.5" height="3" rx="1" fill="#FF7A00" />
      <ellipse cx="16" cy="20.5" rx="15" ry="3.2" fill="#2B1740" />
    </svg>
  );
}

/** Tiny jack-o'-lantern used beside the logo wordmark. */
export function Pumpkin({ size = 14 }: { size?: number }) {
  return (
    <svg className="hw-only hw-pumpkin" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 6c-.2-1.6.4-3 1.8-3.6" stroke="#3F7A2B" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="7.5" cy="14" rx="5.5" ry="7" fill="#E86A00" />
      <ellipse cx="16.5" cy="14" rx="5.5" ry="7" fill="#E86A00" />
      <ellipse cx="12" cy="14" rx="5" ry="7.5" fill="#FF8A1F" />
      <path d="M7 12l2.5-2 1 3zM17 12l-2.5-2-1 3zM7.5 16.5q4.5 3.5 9 0l-1.6.4-1.2 1.1-1.2-1-1.6 1-1.2-1.1z" fill="#2B1740" />
    </svg>
  );
}

export function HalloweenDecor() {
  return (
    <div className="hw-only hw-decor" aria-hidden="true">
      {/* Cobweb + dangling spider in the top-right corner, just under the header */}
      <svg className="hw-web" viewBox="0 0 100 100" width={110} height={110}>
        <g stroke="currentColor" strokeWidth="0.8" fill="none">
          <path d="M100 0L20 0M100 0L35 45M100 0L65 70M100 0L100 80" />
          <path d="M80 0Q82 12 90 9Q96 16 100 16" />
          <path d="M58 0Q62 24 77 18Q88 31 100 33" />
          <path d="M38 0Q44 36 66 27Q80 46 100 50" />
          <path d="M24 0Q30 46 54 36Q70 62 100 66" />
        </g>
      </svg>
      <div className="hw-spider">
        <span className="hw-thread" />
        <svg viewBox="0 0 24 24" width={18} height={18}>
          <g stroke="#1a1a1a" strokeWidth="1.3" fill="none" strokeLinecap="round">
            <path d="M9 11L3 7M9 13H2M9 14l-6 4M15 11l6-4M15 13h7M15 14l6 4" />
          </g>
          <ellipse cx="12" cy="13" rx="4" ry="4.6" fill="#1a1a1a" />
          <circle cx="12" cy="8" r="2.6" fill="#1a1a1a" />
          <circle cx="11" cy="7.6" r=".6" fill="#FF7A00" />
          <circle cx="13" cy="7.6" r=".6" fill="#FF7A00" />
        </svg>
      </div>

      {/* Bats that drift across the viewport now and then */}
      {[0, 1, 2].map((i) => (
        <svg key={i} className={`hw-bat hw-bat-${i}`} viewBox="0 0 24 14" width={34} height={20}>
          <path d={BAT_PATH} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
