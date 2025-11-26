/* eslint-disable react-hooks/refs */
"use client";

import React, { useEffect, useRef, useState } from "react";

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
  // kept minimal props — counts shown by page wrapper
};

export default function SpeedDial({
  deleteMode,
  setDeleteMode,
  addNewCurve,
  resetCanvas,
  handleFileChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const actionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // respect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  useEffect(() => {
    if (open && focusedIndex >= 0) {
      const el = actionRefs.current[focusedIndex];
      el?.focus();
    }
    if (!open) setFocusedIndex(-1);
  }, [open, focusedIndex]);

  return (
    <div data-ui-speeddial style={{ zIndex: 999 }}>  
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        {/* Floating info bubble / toggle first so actions will drop down beneath it */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            id="speeddial-toggle"
            aria-haspopup="menu"
            aria-controls="speeddial-actions"
            aria-expanded={open}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen((s) => !s);
                if (!open) setFocusedIndex(0);
              }
              if (e.key === 'Escape') setOpen(false);
              if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && open) {
                e.preventDefault();
                const dir = e.key === 'ArrowDown' ? 1 : -1;
                setFocusedIndex((i) => (i + dir + actions.length) % actions.length);
              }
            }}
            onClick={() => {
              setOpen((s) => !s);
              if (!open) setFocusedIndex(0);
            }}
            aria-label={open ? "Đóng menu hành động" : "Mở menu hành động"}
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
          </button>

          {/* hidden file input to open the file picker */}
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        {open && (
          <div id="speeddial-actions" role="menu" aria-hidden={!open} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, marginTop: 8 }}>
                      {actions.map((a, idx) => (
                          <button
                              key={a.id}
                              onClick={() => {
                                  a.onClick();
                                  setOpen(false);
                              } }
                              aria-label={a.id === 'delete'
                                  ? deleteMode
                                      ? 'Tắt chế độ xóa'
                                      : 'Bật chế độ xóa'
                                  : a.id === 'add'
                                      ? 'Tạo đường mới'
                                      : a.id === 'reset'
                                          ? 'Reset canvas'
                                          : 'Chọn ảnh'}
                              ref={(el) => { actionRefs.current[idx] = el; } }
                              title={a.id === 'delete'
                                ? deleteMode
                                  ? 'Tắt chế độ xóa'
                                  : 'Bật chế độ xóa'
                                : a.id === 'add'
                                ? 'Tạo đường mới'
                                : a.id === 'reset'
                                ? 'Reset canvas'
                                : 'Chọn ảnh'}
                              role="menuitem"
                              tabIndex={open ? 0 : -1}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      a.onClick();
                                      setOpen(false);
                                  }
                                  if (e.key === 'Escape') setOpen(false);
                                  if (e.key === 'ArrowDown') setFocusedIndex((i) => (i + 1) % actions.length);
                                  if (e.key === 'ArrowUp') setFocusedIndex((i) => (i - 1 + actions.length) % actions.length);
                              } }
                              onFocus={() => setFocusedIndex(idx)}
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
                                  // closed state is slightly above so the open animation looks like a downward drop
                                  transform: open && !prefersReducedMotion ? 'translateY(0)' : 'translateY(-6px)',
                                  opacity: open ? 1 : 0,
                                  transition: prefersReducedMotion ? 'none' : 'opacity 180ms ease, transform 180ms ease',
                              }}
                          >
                              <span style={{ fontSize: 18 }}>{a.emoji}</span>
                              {/* visually show icon only; keep title/aria-label for screen readers and hover tooltip */}
                          </button>
                      ))}
              </div>
        )}

    
      </div>
    </div>
  );
}
