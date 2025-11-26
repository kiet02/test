"use client";

import React from "react";
import type { Point } from "./types";
import { createBezierPath, getBezierLength } from "./bezierUtils";

type Props = {
  curves: Record<number, Point[]>;
  curveColors: string[];
  onSegmentPointerUp?: (
    e: React.PointerEvent<SVGPathElement>,
    startId: number,
    endId: number
  ) => void;
  onSegmentDoubleClick?: (startId: number, endId: number) => void;
};

export default function CurveCanvas({
  curves,
  curveColors,
  onSegmentPointerUp,
  onSegmentDoubleClick,
}: Props) {
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      {Object.entries(curves).map(([curveId, curvePoints]) =>
        curvePoints.map((point, index) => {
          const nextPoint = curvePoints[index + 1];
          const isLast = index === curvePoints.length - 1;
          const color =
            curveColors[(parseInt(curveId, 10) - 1) % curveColors.length];

          return (
            <g key={point.id}>
              {/* Control lines */}
              <line
                x1={point.x}
                y1={point.y}
                x2={point.x + point.leftX}
                y2={point.y + point.leftY}
                stroke="rgba(255,255,0,0.4)"
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
              <line
                x1={point.x}
                y1={point.y}
                x2={point.x + point.rightX}
                y2={point.y + point.rightY}
                stroke="rgba(255,0,255,0.4)"
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
              {isLast && (
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.x + point.topX}
                  y2={point.y + point.topY}
                  stroke="rgba(255,165,0,0.6)"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}

              {/* Bézier path */}
              {nextPoint && (
                <>
                  <path
                    id={`curve-${point.id}-${nextPoint.id}`}
                    d={createBezierPath(point, nextPoint)}
                    stroke={color}
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                    onPointerUp={(e) =>
                      onSegmentPointerUp?.(e as React.PointerEvent<SVGPathElement>, point.id, nextPoint.id)
                    }
                    onPointerDown={(e) => {
                      // capture pointer so we reliably receive pointerup and prevent
                      // default browser gestures on touch where relevant.
                      try {
                        (e.target as Element).setPointerCapture?.(e.pointerId);
                      } catch {}
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onDoubleClick={() => onSegmentDoubleClick?.(point.id, nextPoint.id)}
                  />
                  <text fill="white" fontSize={14} fontWeight="bold" style={{ pointerEvents: "none" }}>
                    <textPath
                      href={`#curve-${point.id}-${nextPoint.id}`}
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {getBezierLength(
                        { x: point.x, y: point.y },
                        { x: point.x + point.rightX, y: point.y + point.rightY },
                        { x: nextPoint.x + nextPoint.leftX, y: nextPoint.y + nextPoint.leftY },
                        { x: nextPoint.x, y: nextPoint.y }
                      ).toFixed(2)}
                      px
                    </textPath>
                  </text>
                </>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}
