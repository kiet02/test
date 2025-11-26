/* eslint-disable react-hooks/refs */
"use client";

import React, { useRef, useState } from "react";

type Action = {
  id: string;
  emoji?: string;
  onClick: () => void;
};

type Props = {
  deleteMode: boolean;
  setDeleteMode: (v: boolean) => void;
  addNewCurve: () => void;
  resetCanvas: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  curveCount: number;
  totalPoints: number;
  totalLength: number;
};

export default function SpeedDial({
  deleteMode,
  setDeleteMode,
  addNewCurve,
  resetCanvas,
  handleFileChange,
  curveCount,
  totalPoints,
  totalLength,
}: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const actions: Action[] = [
    {
      id: "delete",
      emoji: deleteMode ? "🗑️" : "✂️",
      onClick: () => setDeleteMode(!deleteMode),
    },
    { id: "add", emoji: "➕", onClick: addNewCurve },
    { id: "reset",  emoji: "🔄", onClick: resetCanvas },
    {
      id: "image",
      emoji: "🖼️",
      onClick: () => inputRef.current?.click(),
    },
  ];

  return (
    <div style={{ position: "absolute", right: 20, bottom: 20, zIndex: 999 }}>  
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        {open && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  a.onClick();
                  setOpen(false);
                }}
          
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "none",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
                  transform: "translateY(0)",
                }}
              >
                <span style={{ fontSize: 18 }}>{a.emoji}</span>
   
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setOpen((s) => !s)}
            onClick={() => setOpen((s) => !s)}
            aria-label={open ? "Đóng" : "Mở"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 28,
              background: "linear-gradient(135deg,#00bfa5,#1de9b6)",
              color: "white",
              fontSize: 22,
              fontWeight: 800,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              border: "2px solid rgba(255,255,255,0.14)",
              cursor: "pointer",
            }}
          >
            {open ? "×" : "☰"}
          </div>

          {/* hidden file input to open the file picker */}
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>
      </div>
    </div>
  );
}
