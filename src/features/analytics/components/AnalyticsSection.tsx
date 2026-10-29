"use client";

import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { FaChevronDown, FaChevronUp, FaSync, FaChartBar } from "react-icons/fa";

const Charts = lazy(() => import("./Charts"));

const ChartsFallback: React.FC<{ isMobile: boolean }> = ({ isMobile }) => (
  <div
    aria-hidden
    style={{
      height: isMobile ? 280 : 360,
      margin: "8px 20px",
      borderRadius: 12,
      backgroundColor: "var(--color-bg-secondary, #FAFAFA)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--color-text-tertiary, #909090)",
      fontSize: "0.75rem",
    }}
  >
    Loading charts…
  </div>
);

const S = {
  wrapper: {
    borderBottom: "1px solid var(--color-divider, #E5E5E5)",
    backgroundColor: "var(--color-bg-primary, #FFFFFF)",
    transition: "all 0.3s ease",
  } as React.CSSProperties,
  collapsedBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    cursor: "pointer",
    transition: "background-color 0.15s",
  } as React.CSSProperties,
  collapsedLeft: { display: "flex", alignItems: "center", gap: "12px" } as React.CSSProperties,
  collapsedIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, var(--color-accent-primary, #FFBB00), #E6B450)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFFFFF",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(255,107,0,0.2)",
  } as React.CSSProperties,
  collapsedTitle: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    fontFamily: "var(--font-poppins, 'Poppins', sans-serif)",
    color: "var(--color-text-primary, #0F0F0F)",
  } as React.CSSProperties,
  collapsedSub: {
    fontSize: "0.75rem",
    color: "var(--color-text-tertiary, #909090)",
    marginTop: "2px",
  } as React.CSSProperties,
  showBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "10px",
    border: "1px solid var(--color-accent-primary, #FFBB00)",
    backgroundColor: "transparent",
    color: "var(--color-accent-primary, #FFBB00)",
    fontSize: "0.8125rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  } as React.CSSProperties,
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 8px",
  } as React.CSSProperties,
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" } as React.CSSProperties,
  headerIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, var(--color-accent-primary, #FFBB00), #E6B450)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFFFFF",
    flexShrink: 0,
  } as React.CSSProperties,
  headerTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    fontFamily: "var(--font-poppins, 'Poppins', sans-serif)",
    color: "var(--color-text-primary, #0F0F0F)",
  } as React.CSSProperties,
  headerSub: {
    fontSize: "0.75rem",
    color: "var(--color-text-tertiary, #909090)",
    marginTop: "2px",
  } as React.CSSProperties,
  hideBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid var(--color-border-secondary, #E5E5E5)",
    backgroundColor: "transparent",
    color: "var(--color-text-tertiary, #909090)",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  } as React.CSSProperties,
  accentLine: {
    height: "2px",
    margin: "8px 20px 0",
    borderRadius: "1px",
    background: "linear-gradient(90deg, var(--color-accent-primary, #FFBB00), #E6B450, transparent)",
  } as React.CSSProperties,
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    borderTop: "1px solid var(--color-divider, #E5E5E5)",
  } as React.CSSProperties,
  footerLabel: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: "var(--color-text-tertiary, #909090)",
  } as React.CSSProperties,
  footerDots: { display: "flex", gap: "4px" } as React.CSSProperties,
  footerDot: (color: string) =>
    ({ width: "6px", height: "6px", borderRadius: "9999px", backgroundColor: color }) as React.CSSProperties,
  refreshBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "1px solid var(--color-border-secondary, #E5E5E5)",
    backgroundColor: "transparent",
    color: "var(--color-text-tertiary, #909090)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s",
  } as React.CSSProperties,
};

interface AnalyticsSectionProps {
  title?: string;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ title = "Analytics Dashboard" }) => {
  const [showGraphs, setShowGraphs] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const pref = localStorage.getItem("analyticsGraphsVisible");
    if (pref !== null) setShowGraphs(pref === "true");
  }, []);

  const toggle = useCallback(() => {
    setShowGraphs((prev) => {
      const next = !prev;
      localStorage.setItem("analyticsGraphsVisible", String(next));
      return next;
    });
  }, []);

  if (!showGraphs) {
    return (
      <div style={S.wrapper}>
        <div
          style={S.collapsedBar}
          onClick={toggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && toggle()}
          aria-label="Show analytics dashboard"
        >
          <div style={S.collapsedLeft}>
            <div style={S.collapsedIcon}>
              <FaChartBar size={16} />
            </div>
            <div>
              <div style={S.collapsedTitle}>{isMobile ? "Analytics" : title}</div>
              <div style={S.collapsedSub}>{isMobile ? "Tap to show" : "Hidden. Click to show insights"}</div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            style={S.showBtn}
            aria-label="Show graphs"
          >
            {isMobile ? "Show" : "Show Graphs"} <FaChevronDown size={10} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrapper}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerIcon}>
            <FaChartBar size={16} />
          </div>
          <div>
            <p style={S.headerTitle}>{isMobile ? "Analytics" : title}</p>
            <p style={S.headerSub}>{isMobile ? "Real-time insights" : "Real-time insights & visualization"}</p>
          </div>
        </div>
        <button onClick={toggle} style={S.hideBtn} aria-label="Hide analytics">
          {isMobile ? "Hide" : "Hide Dashboard"} <FaChevronUp size={10} />
        </button>
      </div>
      <div style={S.accentLine} />

      <Suspense fallback={<ChartsFallback isMobile={isMobile} />}>
        <Charts isMobile={isMobile} />
      </Suspense>

      <div style={S.footer}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={S.footerLabel}>{isMobile ? "Live" : "Live Data"}</span>
          <div style={S.footerDots}>
            <span style={S.footerDot("var(--color-accent-primary, #FFBB00)")} />
            <span style={S.footerDot("#E6B450")} />
            <span style={S.footerDot("var(--color-accent-active, #CC9900)")} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary, #909090)" }}>
            ⏱️ {isMobile ? "90 days" : "Last 90 days"}
          </span>
          <button
            style={S.refreshBtn}
            title="Refresh"
            onClick={() => window.location.reload()}
            aria-label="Refresh data"
          >
            <FaSync size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
