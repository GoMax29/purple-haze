"use client";

import React from "react";

interface ToggleSimpleDetailProps {
  value?: boolean; // false = simple (☝), true = détail (🖐)
  onChange?: (value: boolean) => void;
}

const ToggleSimpleDetail: React.FC<ToggleSimpleDetailProps> = ({
  value = false,
  onChange,
}) => {
  const handleToggle = () => {
    if (onChange) onChange(!value);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={value ? "Mode détail" : "Mode simple"}
      title={value ? "Mode détail" : "Mode simple"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        borderRadius: "9999px",
        border: "1px solid rgba(255,255,255,0.25)",
        background: "rgba(255,255,255,0.08)",
        color: "white",
        cursor: "pointer",
        fontSize: "0.95em",
        lineHeight: 1,
      }}
    >
      <span style={{ opacity: value ? 0.4 : 1 }}>•</span>
      <div
        style={{
          width: "34px",
          height: "18px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "9999px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: value ? "16px" : "2px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#fbbf24",
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
            transition: "left 0.2s ease",
          }}
        />
      </div>
      <span style={{ opacity: value ? 1 : 0.4 }}>•••</span>
    </button>
  );
};

export default ToggleSimpleDetail;
