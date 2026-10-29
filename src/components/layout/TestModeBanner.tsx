"use client";

import { useAuth } from "@/features/auth/context/AuthContext";

/** Always-visible marker for temporary test-payment accounts. */
export function TestModeBanner() {
  const { authUser, isAuthenticated } = useAuth();
  if (!isAuthenticated || !authUser?.isTestAccount) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: 12,
        bottom: 12,
        zIndex: 9999,
        padding: "6px 12px",
        borderRadius: 9999,
        background: "#F59E0B",
        color: "#000",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.3,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        pointerEvents: "none",
      }}
    >
      TEST MODE: payments are fake, no real money
    </div>
  );
}
