"use client";

import React from "react";
import type { Point } from "./types";

type Props = {
  points: Point[];
  onPointerDown: (
    e: React.PointerEvent,
    pointId: number,
    type: "main" | "left" | "right" | "top"
  ) => void;
};

export default function PointHandles({ points, onPointerDown }: Props) {
  return (
    <>
      {points.map((point) => {
        const curvePoints = points.filter((p) => p.curveId === point.curveId);
        const isLast = curvePoints.indexOf(point) === curvePoints.length - 1;
        return (
          <React.Fragment key={point.id}>
            <div
              data-handle
              data-handle-type="left"
              style={{
                position: "absolute",
                left: point.x + point.leftX - 6,
                top: point.y + point.leftY - 6,
                width: 12,
                height: 12,
                backgroundColor: "#ffeb3b",
                borderRadius: "50%",
                cursor: "grab",
                border: "2px solid rgba(255,255,255,0.8)",
                boxShadow: "0 0 8px rgba(255,235,59,0.6)",
                touchAction: "none",
              }}
              onPointerDown={(e) => onPointerDown(e, point.id, "left")}
            />
            <div
              data-handle
              data-handle-type="right"
              style={{
                position: "absolute",
                left: point.x + point.rightX - 6,
                top: point.y + point.rightY - 6,
                width: 12,
                height: 12,
                backgroundColor: "#e91e63",
                borderRadius: "50%",
                cursor: "grab",
                border: "2px solid rgba(255,255,255,0.8)",
                boxShadow: "0 0 8px rgba(233,30,99,0.6)",
                touchAction: "none",
              }}
              onPointerDown={(e) => onPointerDown(e, point.id, "right")}
            />
            {isLast && (
              <div
                data-handle
                data-handle-type="top"
                style={{
                  position: "absolute",
                  left: point.x + point.topX - 6,
                  top: point.y + point.topY - 6,
                  width: 12,
                  height: 12,
                  backgroundColor: "#ff9800",
                  borderRadius: 2,
                  cursor: "grab",
                  border: "2px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 0 10px rgba(255,152,0,0.7)",
                  touchAction: "none",
                }}
                onPointerDown={(e) => onPointerDown(e, point.id, "top")}
              />
            )}
            <div
              data-handle
              data-handle-type="main"
              style={{
                position: "absolute",
                left: point.x - 10,
                top: point.y - 10,
                width: 20,
                height: 20,
                backgroundColor: isLast ? "#ff3333" : "#00ff00",
                borderRadius: "50%",
                border: "3px solid white",
                cursor: "grab",
                boxShadow: "0 0 12px rgba(255,255,255,0.6)",
                transition: "transform 0.1s",
                touchAction: "none",
              }}
              onPointerDown={(e) => onPointerDown(e, point.id, "main")}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}
