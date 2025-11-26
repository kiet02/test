"use client";

import React, { useEffect, useRef, useState } from "react";

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
      x: 400, // default value
      y: 400, // default value
      leftX: -80,
      leftY: -80,
      rightX: 80,
      rightY: -80,
      topX: 0,
      topY: -150,
      curveId: 1,
    },
  ]);

  useEffect(() => {
    setPoints((prev) =>
      prev.map((p) => ({
        ...p,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }))
    );
  }, []);

  const [nextCurveId, setNextCurveId] = useState(2);
  const [dragging, setDragging] = useState<{
    pointId: number;
    type: "main" | "left" | "right" | "top";
    startX: number;
    startY: number;
    pointerId?: number;
  } | null>(null);

  const [deleteMode, setDeleteMode] = useState(false);

  const tapTimers = useRef<Record<string, number | null>>({});
  const lastTap = useRef<Record<string, number>>({});
  const DOUBLE_TAP_MS = 300;

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

  const handlePointerDown = (
    e: React.PointerEvent,
    pointId: number,
    type: "main" | "left" | "right" | "top"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}
    setDragging({
      pointId,
      type,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const deltaX = e.clientX - dragging.startX;
    const deltaY = e.clientY - dragging.startY;
    setPoints((prev) =>
      prev.map((p) => {
        if (p.id !== dragging.pointId) return p;
        if (dragging.type === "main")
          return { ...p, x: p.x + deltaX, y: p.y + deltaY };
        if (dragging.type === "left")
          return { ...p, leftX: p.leftX + deltaX, leftY: p.leftY + deltaY };
        if (dragging.type === "right")
          return { ...p, rightX: p.rightX + deltaX, rightY: p.rightY + deltaY };
        return { ...p, topX: p.topX + deltaX, topY: p.topY + deltaY };
      })
    );
    setDragging((prev) =>
      prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null
    );
  };

  const handlePointerUp = (e?: React.PointerEvent) => {
    try {
      if (e?.pointerId != null) {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      }
    } catch {}
    if (dragging && dragging.type === "top") {
      const point = points.find((p) => p.id === dragging.pointId);
      if (point) {
        const curvePoints = points.filter((p) => p.curveId === point.curveId);
        const isLastInCurve =
          curvePoints.indexOf(point) === curvePoints.length - 1;
        if (isLastInCurve) {
          const deltaX = point.topX;
          const deltaY = point.topY;
          const updatedPoints = points.map((p) =>
            p.id === point.id
              ? { ...p, rightX: deltaX / 3, rightY: deltaY / 3 }
              : p
          );
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
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
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
    const before = curvePoints.slice(0, startIndex + 1);
    const after = curvePoints.slice(endIndex);
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

  const straightenSegment = (startPointId: number, endPointId: number) => {
    const startPoint = points.find((p) => p.id === startPointId);
    const endPoint = points.find((p) => p.id === endPointId);
    if (!startPoint || !endPoint) return;
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const updatedPoints = points.map((p) => {
      if (p.id === startPoint.id)
        return { ...p, rightX: deltaX / 3, rightY: deltaY / 3 };
      if (p.id === endPoint.id)
        return { ...p, leftX: -deltaX / 3, leftY: -deltaY / 3 };
      return p;
    });
    setPoints(updatedPoints);
  };

  const handleSegmentPointerUp = (
    e: React.PointerEvent<SVGPathElement>,
    startId: number,
    endId: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const key = `${startId}-${endId}`;
    const now = Date.now();
    if (deleteMode) {
      deleteSegment(startId, endId);
      if (tapTimers.current[key]) window.clearTimeout(tapTimers.current[key]!);
      tapTimers.current[key] = null;
      lastTap.current[key] = 0;
      return;
    }
    const previous = lastTap.current[key] || 0;
    if (previous && now - previous < DOUBLE_TAP_MS) {
      if (tapTimers.current[key]) window.clearTimeout(tapTimers.current[key]!);
      tapTimers.current[key] = null;
      lastTap.current[key] = 0;
      straightenSegment(startId, endId);
      return;
    }
    lastTap.current[key] = now;
    if (tapTimers.current[key]) window.clearTimeout(tapTimers.current[key]!);
    tapTimers.current[key] = window.setTimeout(() => {
      straightenSegment(startId, endId);
      tapTimers.current[key] = null;
      lastTap.current[key] = 0;
    }, DOUBLE_TAP_MS);
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
        touchAction: "none",
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
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
              curveColors[(parseInt(curveId) - 1) % curveColors.length];
            return (
              <g key={point.id}>
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
                {nextPoint && (
                  <>
                    <path
                      d={createBezierPath(point, nextPoint)}
                      stroke="transparent"
                      strokeWidth={30}
                      fill="none"
                      style={{
                        pointerEvents: "auto",
                        cursor: deleteMode ? "pointer" : "pointer",
                      }}
                      onPointerUp={(e) =>
                        handleSegmentPointerUp(e, point.id, nextPoint.id)
                      }
                    />
                    <path
                      d={createBezierPath(point, nextPoint)}
                      stroke={color}
                      strokeWidth={4}
                      fill="none"
                      strokeLinecap="round"
                      style={{ pointerEvents: "none" }}
                    />
                  </>
                )}
              </g>
            );
          })
        )}
      </svg>
      {points.map((point) => {
        const curvePoints = points.filter((p) => p.curveId === point.curveId);
        const isLast = curvePoints.indexOf(point) === curvePoints.length - 1;
        return (
          <React.Fragment key={point.id}>
            <div
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
              onPointerDown={(e) => handlePointerDown(e, point.id, "left")}
            />
            <div
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
              onPointerDown={(e) => handlePointerDown(e, point.id, "right")}
            />
            {isLast && (
              <div
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
                onPointerDown={(e) => handlePointerDown(e, point.id, "top")}
              />
            )}
            <div
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
              onPointerDown={(e) => handlePointerDown(e, point.id, "main")}
            />
          </React.Fragment>
        );
      })}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            color: "white",
            backgroundColor: "rgba(0,0,0,0.85)",
            padding: "12px 20px",
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 14,
            fontWeight: "bold",
          }}
        >
          <div>Số đường: {Object.keys(curves).length}</div>
          <div>Tổng điểm: {points.length}</div>
          {deleteMode && (
            <div style={{ color: "#ff5252", marginTop: 8 }}>
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
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
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
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
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
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
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
