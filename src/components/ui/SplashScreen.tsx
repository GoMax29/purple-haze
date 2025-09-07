"use client";

import React, { useEffect, useState } from "react";
import { useAppPreload } from "../../hooks/useAppPreload";

const SplashScreen: React.FC = () => {
  const { isReady } = useAppPreload();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isReady) {
      const t = setTimeout(() => setFadeOut(true), 200);
      return () => clearTimeout(t);
    }
  }, [isReady]);

  return (
    <div
      aria-label="Splash screen Purple Haze"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: fadeOut ? "none" : "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg,#8b34ea,#2d1a65 40%,#5058b8 70%,#37246d)",
        color: "white",
        transition: "opacity 400ms ease",
        opacity: isReady ? 0 : 1,
      }}
    >
      <div style={{ display: "grid", gap: 12, placeItems: "center" }}>
        {/* Icon */}
        <div style={{ width: 120, height: 120, position: "relative" }}>
          {/* sun pulse */}
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 6,
              width: 44,
              height: 44,
              borderRadius: 99,
              background: "#f6c945",
              boxShadow: "0 0 0 0 rgba(246,201,69,0.7)",
              animation: "sunPulse 2.2s infinite ease-out",
            }}
          />
          {/* cloud + rain */}
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 18,
              width: 46,
              height: 30,
              borderRadius: 18,
              background: "#c5ccf5",
            }}
          />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 70 + i * 10,
                top: 58,
                width: 3,
                height: 12,
                borderRadius: 2,
                background: "#8d34ea",
                animation: `drop 900ms ${i * 120}ms infinite ease-in`,
              }}
            />
          ))}
          {/* fog */}
          {[0, 1, 2].map((i) => (
            <div
              key={`fog-${i}`}
              style={{
                position: "absolute",
                left: 12,
                bottom: 12 + i * 6,
                width: 96,
                height: 6,
                borderRadius: 6,
                background: "rgba(255,255,255,0.25)",
                animation: `fog 3.2s ${i * 250}ms infinite ease-in-out`,
              }}
            />
          ))}
          {/* wave */}
          <div
            style={{
              position: "absolute",
              right: 6,
              bottom: 10,
              width: 70,
              height: 14,
              borderRadius: 999,
              background: "#5058b8",
              transform: "translateY(0)",
              animation: "wave 2.6s infinite ease-in-out",
            }}
          />
        </div>
        <div style={{ fontWeight: 800, letterSpacing: 0.6 }}>Purple Haze</div>
      </div>

      <style>{`
        @keyframes sunPulse {
          0% { box-shadow: 0 0 0 0 rgba(246,201,69,0.7); }
          70% { box-shadow: 0 0 0 18px rgba(246,201,69,0); }
          100% { box-shadow: 0 0 0 0 rgba(246,201,69,0); }
        }
        @keyframes drop {
          0% { transform: translateY(0); opacity: 1; }
          80% { opacity: .9; }
          100% { transform: translateY(18px); opacity: 0; }
        }
        @keyframes fog {
          0%,100% { transform: translateX(0); opacity: .6; }
          50% { transform: translateX(6px); opacity: .9; }
        }
        @keyframes wave {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
