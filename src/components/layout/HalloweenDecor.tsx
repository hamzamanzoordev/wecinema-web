/**
 * Seasonal Halloween decorations. Always rendered, but hidden unless the root
 * <html> has data-season="halloween" (set pre-paint in app/layout.tsx), so the
 * season check never causes a hydration mismatch. Styles live in globals.css
 * under "Halloween season".
 */

const BAT_PATH =
  "M12 6c.6-1 1.2-1.4 1.6-1.4l.3 1.6c.9-.5 2.6-.4 4 .3 1.6.8 3.2 2.3 4.1 4.2-1.2-.6-2.4-.6-3.2 0-.8-.8-2.2-1-3.1-.3-.6-.6-1.6-.8-2.4-.3-.4.6-.9 1.3-1.3 2.2-.4-.9-.9-1.6-1.3-2.2-.8-.5-1.8-.3-2.4.3-.9-.7-2.3-.5-3.1.3-.8-.6-2-.6-3.2 0 .9-1.9 2.5-3.4 4.1-4.2 1.4-.7 3.1-.8 4-.3l.3-1.6c.4 0 1 .4 1.6 1.4z";

/**
 * Jack-o'-lantern version of the logo with "WE" carved into it (same
 * overlapping W/E letterforms as /wecinema.webp). Shown in place of the normal
 * mark during the Halloween season.
 */
export function PumpkinLogo() {
  return (
    <svg className="hw-only hw-pumpkin-logo" viewBox="0 0 40 36" width={34} height={31} aria-hidden="true">
      <defs>
        <radialGradient id="hwSkin" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FF9A2E" />
          <stop offset="100%" stopColor="#D85A00" />
        </radialGradient>
        <radialGradient id="hwGlow" cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="#FFF3A6" />
          <stop offset="100%" stopColor="#FFC21A" />
        </radialGradient>
      </defs>
      <path d="M20 8c-.4-2.6.6-4.8 3-5.8l1 1.6c-1.8.9-2.3 2.4-2 4.2z" fill="#4C7A2A" />
      <ellipse cx="11" cy="21" rx="10" ry="13" fill="url(#hwSkin)" />
      <ellipse cx="29" cy="21" rx="10" ry="13" fill="url(#hwSkin)" />
      <ellipse cx="20" cy="21" rx="11.5" ry="14" fill="url(#hwSkin)" />
      <path d="M14 8.5q-4 12.5 0 25M26 8.5q4 12.5 0 25" stroke="#B84A00" strokeWidth=".8" fill="none" opacity=".55" />
      <g className="hw-carve" fill="url(#hwGlow)" stroke="#7A2A00" strokeWidth=".7" strokeLinejoin="round" paintOrder="stroke">
        {/* One path so the W/E overlap has no inner stroke seam */}
        <path d="M8.5 13h2.8l1.6 8.5 1.7-8.5h2.6l1.7 8.5 1.6-8.5h2.8l-2.9 14h-2.8l-1.7-7.7-1.7 7.7h-2.8zM21.8 13H31v3h-6.4v2.6h5v2.8h-5V24h6.6v3h-9.4z" />
      </g>
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
