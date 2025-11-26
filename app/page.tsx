/* eslint-disable react/no-unescaped-entities */
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
  curveId: number;
}

export default function BezierCurveEditor() {
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
      curveId: 1,
    },
  ]);

  const [nextCurveId, setNextCurveId] = useState(2);
  const [dragging, setDragging] = useState<{
    pointId: number;
    type: "main" | "left" | "right" | "top";
    startX: number;
    startY: number;
  } | null>(null);

  const [hoveredCurveId, setHoveredCurveId] = useState<number | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);

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
        const curvePoints = points.filter((p) => p.curveId === point.curveId);
        const isLastInCurve =
          curvePoints.indexOf(point) === curvePoints.length - 1;

        if (isLastInCurve) {
          const deltaX = point.topX;
          const deltaY = point.topY;

          const updatedPoints = points.map((p) => {
            if (p.id === point.id) {
              return {
                ...p,
                rightX: deltaX / 3,
                rightY: deltaY / 3,
              };
            }
            return p;
          });

          const newPoint: Point = {
            id: Math.max(...points.map((p) => p.id)) + 1,
            x: point.x + point.topX,
            y: point.y + point.topY,
            leftX: (deltaX * 2) / 3 - deltaX,
            leftY: (deltaY * 2) / 3 - deltaY,
            rightX: 80,
            rightY: -80,
            topX: 0,
            topY: -150,
            curveId: point.curveId,
          };

          setPoints([...updatedPoints, newPoint]);
        }
      }
    }
    setDragging(null);
  };

  const addNewCurve = () => {
    const newPoint: Point = {
      id: Math.max(...points.map((p) => p.id)) + 1,
      x: 200 + Math.random() * 400,
      y: 200 + Math.random() * 300,
      leftX: -80,
      leftY: -80,
      rightX: 80,
      rightY: -80,
      topX: 0,
      topY: -150,
      curveId: nextCurveId,
    };
    setPoints((prev) => [...prev, newPoint]);
    setNextCurveId((prev) => prev + 1);
  };

  const resetCanvas = () => {
    setPoints([
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
        curveId: 1,
      },
    ]);
    setNextCurveId(2);
  };

  // ===== Xóa 1 segment giữa 2 điểm (sửa để cấp curveId mới đúng) =====
  const deleteSegment = (startPointId: number, endPointId: number) => {
    const startPoint = points.find((p) => p.id === startPointId);
    const endPoint = points.find((p) => p.id === endPointId);
    if (!startPoint || !endPoint) return;

    const originalCurveId = startPoint.curveId;
    const curvePoints = points
      .filter((p) => p.curveId === originalCurveId)
      .sort((a, b) => a.id - b.id);

    const startIndex = curvePoints.indexOf(startPoint);
    const endIndex = curvePoints.indexOf(endPoint);

    if (startIndex === -1 || endIndex === -1 || endIndex !== startIndex + 1)
      return;

    const before = curvePoints.slice(0, startIndex + 1); // include startPoint
    const after = curvePoints.slice(endIndex); // include endPoint

    const updatedPoints = points.filter((p) => p.curveId !== originalCurveId);

    let newPoints: Point[] = [];
    let nextIdForCurve = nextCurveId;

    if (before.length > 1) {
      newPoints = newPoints.concat(
        before.map((p) => ({ ...p, curveId: nextIdForCurve }))
      );
      nextIdForCurve++;
    }

    if (after.length > 1) {
      newPoints = newPoints.concat(
        after.map((p) => ({ ...p, curveId: nextIdForCurve }))
      );
      nextIdForCurve++;
    }

    setPoints([...updatedPoints, ...newPoints]);
    setNextCurveId(nextIdForCurve);
  };

  // ===== Chuyển segment thành đường thẳng khi double click =====
  const straightenSegment = (startPointId: number, endPointId: number) => {
    if (deleteMode) return; // không straight khi đang ở chế độ xóa
    const startPoint = points.find((p) => p.id === startPointId);
    const endPoint = points.find((p) => p.id === endPointId);
    if (!startPoint || !endPoint) return;

    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;

    const updatedPoints = points.map((p) => {
      if (p.id === startPoint.id) {
        return { ...p, rightX: deltaX / 3, rightY: deltaY / 3 };
      }
      if (p.id === endPoint.id) {
        return { ...p, leftX: -deltaX / 3, leftY: -deltaY / 3 };
      }
      return p;
    });

    setPoints(updatedPoints);
  };

  const curves = points.reduce((acc, point) => {
    if (!acc[point.curveId]) acc[point.curveId] = [];
    acc[point.curveId].push(point);
    return acc;
  }, {} as Record<number, Point[]>);

  const curveColors = [
    "#00ffff",
    "#ff69b4",
    "#00ff00",
    "#ffff00",
    "#ff8c00",
    "#9370db",
    "#00ced1",
    "#ff1493",
  ];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        position: "relative",
        overflow: "hidden",
        cursor: dragging ? "grabbing" : "default",
        userSelect: "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
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
        {Object.entries(curves).map(([curveId, curvePoints]) => {
          const color =
            curveColors[(parseInt(curveId) - 1) % curveColors.length];
          const isHovered = hoveredCurveId === parseInt(curveId);

          return curvePoints.map((point, index) => {
            const isLastInCurve = index === curvePoints.length - 1;
            const nextPoint = curvePoints[index + 1];

            return (
              <g key={point.id}>
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.x + point.leftX}
                  y2={point.y + point.leftY}
                  stroke="rgba(255,255,0,0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={point.x + point.rightX}
                  y2={point.y + point.rightY}
                  stroke="rgba(255,0,255,0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                {isLastInCurve && (
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
                      stroke="transparent"
                      strokeWidth="20"
                      fill="none"
                      style={{
                        pointerEvents: "auto",
                        cursor: deleteMode ? "pointer" : "pointer",
                      }}
                      onMouseEnter={() => setHoveredCurveId(point.curveId)}
                      onMouseLeave={() => setHoveredCurveId(null)}
                      onClick={() =>
                        deleteMode && deleteSegment(point.id, nextPoint.id)
                      }
                      onDoubleClick={() =>
                        !deleteMode && straightenSegment(point.id, nextPoint.id)
                      }
                    />
                    <path
                      d={createBezierPath(point, nextPoint)}
                      stroke={color}
                      strokeWidth={isHovered && deleteMode ? 6 : 4}
                      fill="none"
                      strokeLinecap="round"
                      style={{
                        pointerEvents: "none",
                        filter:
                          isHovered && deleteMode
                            ? `drop-shadow(0 0 8px ${color})`
                            : "none",
                        opacity: deleteMode && isHovered ? 0.7 : 1,
                        transition: "all 0.2s",
                      }}
                    />
                  </>
                )}
              </g>
            );
          });
        })}
      </svg>

      {points.map((point) => {
        const curvePoints = points.filter((p) => p.curveId === point.curveId);
        const isLastInCurve =
          curvePoints.indexOf(point) === curvePoints.length - 1;

        return (
          <React.Fragment key={point.id}>
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
            {isLastInCurve && (
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
            <div
              style={{
                position: "absolute",
                left: point.x - 10,
                top: point.y - 10,
                width: "20px",
                height: "20px",
                backgroundColor: isLastInCurve ? "#ff3333" : "#00ff00",
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

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            color: "white",
            backgroundColor: "rgba(0,0,0,0.85)",
            padding: "12px 20px",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          <div>Số đường: {Object.keys(curves).length}</div>
          <div>Tổng điểm: {points.length}</div>
          {deleteMode && (
            <div style={{ color: "#ff5252", marginTop: "8px" }}>
              🗑️ Chế độ xóa: BẬT
            </div>
          )}
        </div>

        <button
          onClick={() => setDeleteMode(!deleteMode)}
          style={{
            padding: "12px 24px",
            backgroundColor: deleteMode ? "#ff5252" : "#757575",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            transition: "all 0.2s",
          }}
        >
          {deleteMode ? "🗑️ Tắt chế độ xóa" : "✂️ Bật chế độ xóa"}
        </button>
        <button
          onClick={addNewCurve}
          style={{
            padding: "12px 24px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            transition: "all 0.2s",
          }}
        >
          ➕ Tạo đường mới
        </button>
        <button
          onClick={resetCanvas}
          style={{
            padding: "10px 20px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            transition: "all 0.2s",
          }}
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
