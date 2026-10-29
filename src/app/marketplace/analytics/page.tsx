"use client";
import React from "react";
import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';

const Analytics: React.FC = () => {
  return (
    <MarketplaceLayout>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Analytics</h1>
        <p style={{ color: "#888", fontSize: 16 }}>Coming soon. Your marketplace analytics will appear here.</p>
      </div>
    </MarketplaceLayout>
  );
};

export default Analytics;
