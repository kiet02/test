"use client";

import React, { useEffect, useRef, useState } from "react";
import CurveCanvas from "./components/CurveCanvas";
import PointHandles from "./components/PointHandles";
import type { Point } from "./components/types";
import { getBezierLength } from "./components/bezierUtils";
import SpeedDial from "./components/SpeedDial";



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
        x: window.innerWidth,
        y: window.innerHeight ,
      }))
    );
  }, []);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [nextCurveId, setNextCurveId] = useState(2);
  const [dragging, setDragging] = useState<{
    pointId: number;
    type: "main" | "left" | "right" | "top";
    startX: number;
    startY: number;
    pointerId?: number;
  } | null>(null);

  // view transform (pan & zoom)
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panning, setPanning] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  // active pointers for multi-touch/pinch
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    active: boolean;
    initialDistance: number;
    initialScale: number;
    midScreenX: number;
    midScreenY: number;
    startPan: { x: number; y: number };
  }>({ active: false, initialDistance: 0, initialScale: 1, midScreenX: 0, midScreenY: 0, startPan: { x: 0, y: 0 } });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const _initialCentered = useRef(false);

  useEffect(() => {
    if (_initialCentered.current) return;
    const el = containerRef.current;
    if (!el) return;

    const innerFactor = 2; // inner element is 200% × 200%
    const rect = el.getBoundingClientRect();
    const desiredPanX = (rect.width - rect.width * innerFactor * scale) / (2 * scale);
    const desiredPanY = (rect.height - rect.height * innerFactor * scale) / (2 * scale);

    setPan({ x: desiredPanX, y: desiredPanY });
    _initialCentered.current = true;
  }, [scale]);

  const [deleteMode, setDeleteMode] = useState(false);

  const tapTimers = useRef<Record<string, number | null>>({});
  const lastTap = useRef<Record<string, number>>({});
  const DOUBLE_TAP_MS = 300;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBackgroundImage(reader.result as string);
    };
    reader.readAsDataURL(file);
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

  // Start panning when clicking/touching the background (not on handles)
  const handleBackgroundPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // don't start panning when starting to drag a point handle or already interacting
    if (dragging) return;
    const targetEl = (e.target as Element) || null;
    // if the pointerdown occurred on a handle (or inside it) or UI, don't pan — let the UI/handle logic run
    if (targetEl?.closest && (targetEl.closest("[data-handle]") || targetEl.closest("[data-ui-speeddial]"))) return;
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {}

    // register pointer for multi-touch
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // if at least two pointers are down we start pinch
    if (pointersRef.current.size >= 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const initialDistance = Math.hypot(dx, dy) || 1;
      const midScreenX = (pts[0].x + pts[1].x) / 2;
      const midScreenY = (pts[0].y + pts[1].y) / 2;
      pinchRef.current = {
        active: true,
        initialDistance,
        initialScale: scale,
        midScreenX,
        midScreenY,
        startPan: { ...pan },
      };
      setPanning(null);
      return;
    }

    setPanning({ pointerId: e.pointerId, startX: e.clientX, startY: e.clientY });
  };

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const handlePointerMove = (e: React.PointerEvent) => {
    // update pointer positions for pinch if tracked
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // handle active pinch
    if (pinchRef.current.active) {
      const pts = Array.from(pointersRef.current.values());
      if (pts.length < 2) return;
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const dist = Math.hypot(dx, dy) || 1;
      const { initialDistance, initialScale, midScreenX, midScreenY, startPan } = pinchRef.current;
      const newScale = clamp(initialScale * (dist / initialDistance), 0.25, 4);

      // world coords of mid point (before zoom)
      const worldX = (midScreenX - startPan.x) / initialScale;
      const worldY = (midScreenY - startPan.y) / initialScale;

      // new pan so the world point stays under the same screen point
      const newPanX = midScreenX - worldX * newScale;
      const newPanY = midScreenY - worldY * newScale;

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
      return;
    }

    // If panning active and not dragging a point, move the view
    if (panning && !dragging) {
      const deltaX = e.clientX - panning.startX;
      const deltaY = e.clientY - panning.startY;
      setPan((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setPanning((prev) => (prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null));
      return;
    }

    if (!dragging) return;

    // convert screen delta into world delta by dividing by scale
    const deltaX = (e.clientX - dragging.startX) / scale;
    const deltaY = (e.clientY - dragging.startY) / scale;
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
    setDragging((prev) => (prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null));
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
          const nextIdBase = points.length > 0 ? Math.max(...points.map((p) => p.id)) : 0;
          const newPoint: Point = {
            id: nextIdBase + 1,
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
    // remove pointer from active pointers (for pinch tracking)
    if (e?.pointerId != null) {
      pointersRef.current.delete(e.pointerId);
    }

    // stop pinch when fewer than 2 pointers remain
    if (pinchRef.current.active && pointersRef.current.size < 2) {
      pinchRef.current.active = false;
    }

    // release panning if it was active and pointer matched
    if (panning && (!e || e.pointerId === panning.pointerId)) setPanning(null);
    setDragging(null);
  };

  const addNewCurve = () => {
    const nextIdBase = points.length > 0 ? Math.max(...points.map((p) => p.id)) : 0;
    const newPoint: Point = {
      id: nextIdBase + 1,
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

  // wheel-to-zoom around cursor when ctrl/cmd pressed
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      // allow wheel-to-zoom on the canvas (trackpad pinch / wheel will zoom)
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const curScale = scale;
    // smooth exponential zoom
    const zoomFactor = Math.exp(-e.deltaY * 0.0015);
    const newScale = clamp(curScale * zoomFactor, 0.25, 4);

    // keep point under cursor stable
    const worldX = (cursorX - pan.x) / curScale;
    const worldY = (cursorY - pan.y) / curScale;
    const newPanX = cursorX - worldX * newScale;
    const newPanY = cursorY - worldY * newScale;

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  const curves = points.reduce((acc, point) => {
    if (!acc[point.curveId]) acc[point.curveId] = [];
    acc[point.curveId].push(point);
    return acc;
  }, {} as Record<number, Point[]>);
  // getBezierLength is imported from ./components/bezierUtils

  // Tính tổng độ dài các đường Bézier
  const totalLength = Object.values(curves).reduce((sum, curvePoints) => {
    let len = 0;
    curvePoints.forEach((point, i) => {
      const nextPoint = curvePoints[i + 1];
      if (!nextPoint) return;
      len += getBezierLength(
        { x: point.x, y: point.y },
        { x: point.x + point.rightX, y: point.y + point.rightY },
        { x: nextPoint.x + nextPoint.leftX, y: nextPoint.y + nextPoint.leftY },
        { x: nextPoint.x, y: nextPoint.y }
      );
    });
    return sum + len;
  }, 0);
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
        height: "100dvh",
        minHeight: "100vh",
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
        cursor: dragging || panning ? "grabbing" : scale > 1 ? "grab" : "default",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        userSelect: "none",
        touchAction: "none", 
        backgroundColor: "#222",
      }}
      ref={containerRef}
      onPointerDown={handleBackgroundPointerDown}
      onWheel={handleWheel}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          width: "200%",
          height: "200%",
          backgroundColor: "black",
        }}
        onPointerDown={handleBackgroundPointerDown}
      >
        <CurveCanvas
        curves={curves}
        curveColors={curveColors}
          onSegmentPointerUp={handleSegmentPointerUp}
          onSegmentDoubleClick={(startId, endId) => straightenSegment(startId, endId)}
      />
        <PointHandles points={points} onPointerDown={handlePointerDown} />
      </div>
      <div
        style={{
          position: "absolute",
          top: `calc(20px + env(safe-area-inset-top, 0px))`,
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
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "8px 12px",
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 13,
            fontWeight: 600,
            textAlign: "right",
            minWidth: 140,
          }}
        >
          <div>Số đường: {Object.keys(curves).length}</div>
          <div>Tổng điểm: {points.length}</div>
          <div>Độ dài: {totalLength.toFixed(2)}</div>
        </div>
      <SpeedDial
        deleteMode={deleteMode}
        setDeleteMode={setDeleteMode}
        addNewCurve={addNewCurve}
        resetCanvas={resetCanvas}
        handleFileChange={handleFileChange}
      />
      </div>
    </div>
  );
}
