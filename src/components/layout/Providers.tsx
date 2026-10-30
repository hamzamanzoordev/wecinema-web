"use client";

import { type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { TestModeBanner } from "@/components/layout/TestModeBanner";
import { HalloweenDecor } from "@/components/layout/HalloweenDecor";
import { UploadManagerProvider } from "@/features/upload/context/UploadManagerProvider";
import { Analytics } from "@/components/analytics/Analytics";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { ConsentProvider } from "@/features/consent/ConsentProvider";
import { CookieBanner } from "@/features/consent/components/CookieBanner";
import { CookieSettingsModal } from "@/features/consent/components/CookieSettingsModal";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ConsentProvider>
        <AuthProvider>
          <UploadManagerProvider>
          {children}
          <TestModeBanner />
          <HalloweenDecor />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--color-bg-elevated)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border-secondary)",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 500,
              },
            }}
          />
          </UploadManagerProvider>
        </AuthProvider>
        <CookieBanner />
        <CookieSettingsModal />
        {/* Each tracker renders nothing until the visitor consents to its category. */}
        <Analytics />
        <MetaPixel />
      </ConsentProvider>
    </ThemeProvider>
  );
}
