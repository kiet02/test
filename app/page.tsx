"use client";
import React, { useState } from "react";

interface Point {
  id: number;
  x: number;
  y: number;
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
  topX: number;
  topY: number;
}

export default function App() {
  const [points, setPoints] = useState<Point[]>([
    {
      id: 1,
      x: 400,
      y: 400,
      leftX: -80,
      leftY: -80,
      rightX: 80,
      rightY: -80,
      topX: 0,
      topY: -150,
    },
  ]);

  const [dragging, setDragging] = useState<{
    pointId: number;
    type: "main" | "left" | "right" | "top";
    startX: number;
    startY: number;
  } | null>(null);

  const createBezierPath = (point: Point, nextPoint: Point) => {
    const startX = point.x;
    const startY = point.y;
    const cp1X = point.x + point.rightX;
    const cp1Y = point.y + point.rightY;
    const cp2X = nextPoint.x + nextPoint.leftX;
    const cp2Y = nextPoint.y + nextPoint.leftY;
    const endX = nextPoint.x;
    const endY = nextPoint.y;

    return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    pointId: number,
    type: "main" | "left" | "right" | "top"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging({
      pointId,
      type,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;

    const deltaX = e.clientX - dragging.startX;
    const deltaY = e.clientY - dragging.startY;

    setPoints((prev) =>
      prev.map((p) => {
        if (p.id !== dragging.pointId) return p;

        if (dragging.type === "main") {
          return { ...p, x: p.x + deltaX, y: p.y + deltaY };
        } else if (dragging.type === "left") {
          return { ...p, leftX: p.leftX + deltaX, leftY: p.leftY + deltaY };
        } else if (dragging.type === "right") {
          return { ...p, rightX: p.rightX + deltaX, rightY: p.rightY + deltaY };
        } else {
          return { ...p, topX: p.topX + deltaX, topY: p.topY + deltaY };
        }
      })
    );

    setDragging((prev) =>
      prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null
    );
  };

  const handleMouseUp = () => {
    if (dragging && dragging.type === "top") {
      const point = points.find((p) => p.id === dragging.pointId);
      if (point) {
        const isLast = points.indexOf(point) === points.length - 1;
        if (isLast) {
          // Tạo điểm mới
          const newPoint: Point = {
            id: Math.max(...points.map((p) => p.id)) + 1,
            x: point.x + point.topX,
            y: point.y + point.topY,
            leftX: -80,
            leftY: -80,
            rightX: 80,
            rightY: -80,
            topX: 0,
            topY: -150,
          };
          setPoints((prev) => [...prev, newPoint]);
        }
      }
    }
    setDragging(null);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        position: "relative",
        overflow: "hidden",
        cursor: dragging ? "grabbing" : "default",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* SVG Canvas */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {points.map((point, index) => {
          const isLast = index === points.length - 1;
          const nextPoint = points[index + 1];

          return (
            <g key={point.id}>
              {/* Guide line to left control */}
              <line
                x1={point.x}
                y1={point.y}
                x2={point.x + point.leftX}
                y2={point.y + point.leftY}
                stroke="rgba(255,255,0,0.4)"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />

              {/* Guide line to right control */}
              <line
                x1={point.x}
                y1={point.y}
                x2={point.x + point.rightX}
                y2={point.y + point.rightY}
                stroke="rgba(255,0,255,0.4)"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />

              {/* Guide line to top (only for last point) */}
              {isLast && (
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.x + point.topX}
                  y2={point.y + point.topY}
                  stroke="rgba(255,165,0,0.6)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}

              {/* Bezier curve to next point */}
              {nextPoint && (
                <>
                  <line
                    x1={nextPoint.x}
                    y1={nextPoint.y}
                    x2={nextPoint.x + nextPoint.leftX}
                    y2={nextPoint.y + nextPoint.leftY}
                    stroke="rgba(255,255,0,0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                  <path
                    d={createBezierPath(point, nextPoint)}
                    stroke="#00ffff"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Control Points */}
      {points.map((point, index) => {
        const isLast = index === points.length - 1;

        return (
          <React.Fragment key={point.id}>
            {/* Left Control Point (Yellow Circle) */}
            <div
              style={{
                position: "absolute",
                left: point.x + point.leftX - 6,
                top: point.y + point.leftY - 6,
                width: "12px",
                height: "12px",
                backgroundColor: "#ffeb3b",
                borderRadius: "50%",
                cursor: "grab",
                border: "2px solid rgba(255,255,255,0.8)",
                boxShadow: "0 0 8px rgba(255,235,59,0.6)",
              }}
              onMouseDown={(e) => handleMouseDown(e, point.id, "left")}
            />

            {/* Right Control Point (Magenta Circle) */}
            <div
              style={{
                position: "absolute",
                left: point.x + point.rightX - 6,
                top: point.y + point.rightY - 6,
                width: "12px",
                height: "12px",
                backgroundColor: "#e91e63",
                borderRadius: "50%",
                cursor: "grab",
                border: "2px solid rgba(255,255,255,0.8)",
                boxShadow: "0 0 8px rgba(233,30,99,0.6)",
              }}
              onMouseDown={(e) => handleMouseDown(e, point.id, "right")}
            />

            {/* Top Point (Orange Square) - Only for last point */}
            {isLast && (
              <div
                style={{
                  position: "absolute",
                  left: point.x + point.topX - 6,
                  top: point.y + point.topY - 6,
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#ff9800",
                  borderRadius: "2px",
                  cursor: "grab",
                  border: "2px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 0 10px rgba(255,152,0,0.7)",
                }}
                onMouseDown={(e) => handleMouseDown(e, point.id, "top")}
              />
            )}

            {/* Main Point */}
            <div
              style={{
                position: "absolute",
                left: point.x - 10,
                top: point.y - 10,
                width: "20px",
                height: "20px",
                backgroundColor: isLast ? "#ff3333" : "#00ff00",
                borderRadius: "50%",
                border: "3px solid white",
                cursor: "grab",
                boxShadow: "0 0 12px rgba(255,255,255,0.6)",
                transition: "transform 0.1s",
              }}
              onMouseDown={(e) => handleMouseDown(e, point.id, "main")}
            />
          </React.Fragment>
        );
      })}

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "white",
          backgroundColor: "rgba(0,0,0,0.85)",
          padding: "20px",
          borderRadius: "12px",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          maxWidth: "320px",
        }}
      >
        <div
          style={{ fontWeight: "bold", marginBottom: "12px", fontSize: "16px" }}
        >
          🎨 Hướng dẫn sử dụng
        </div>
        <div style={{ marginBottom: "6px" }}>
          🔴 <strong>Điểm đỏ:</strong> Điểm cuối (chưa nối)
        </div>
        <div style={{ marginBottom: "6px" }}>
          🟢 <strong>Điểm xanh:</strong> Điểm đã nối
        </div>
        <div style={{ marginBottom: "6px" }}>
          🟡 <strong>Tròn vàng:</strong> Control point trái
        </div>
        <div style={{ marginBottom: "6px" }}>
          🟣 <strong>Tròn tím:</strong> Control point phải
        </div>
        <div style={{ marginBottom: "6px" }}>
          🟧 <strong>Vuông cam:</strong> Kéo để tạo điểm mới
        </div>
        <div
          style={{
            marginTop: "15px",
            paddingTop: "15px",
            borderTop: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div style={{ marginBottom: "6px" }}>
            ✅ Kéo vuông cam đến vị trí mong muốn
          </div>
          <div style={{ marginBottom: "6px" }}>
            ✅ Thả ra để tạo điểm kết nối mới
          </div>
          <div>✅ Kéo các điểm để tạo đường cong</div>
        </div>
      </div>

      {/* Point Counter */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          color: "white",
          backgroundColor: "rgba(0,0,0,0.85)",
          padding: "12px 20px",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        Tổng số điểm: {points.length}
      </div>
    </div>
  );
}
