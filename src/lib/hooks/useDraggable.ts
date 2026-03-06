"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const STORAGE_KEY = "coco-bubble-corner";
const DRAG_THRESHOLD = 5;
const SNAP_DURATION = 300;

function getStoredCorner(): Corner {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (
      stored === "bottom-right" ||
      stored === "bottom-left" ||
      stored === "top-right" ||
      stored === "top-left"
    ) {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return "bottom-right";
}

function storeCorner(corner: Corner): void {
  try {
    localStorage.setItem(STORAGE_KEY, corner);
  } catch {
    // localStorage unavailable
  }
}

interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  hasMoved: boolean;
}

interface UseDraggableReturn {
  corner: Corner;
  isDragging: boolean;
  isSnapping: boolean;
  dragStyle: React.CSSProperties | undefined;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
  };
  /** Whether the last interaction was a drag (not a tap) — used to suppress click */
  wasDrag: boolean;
}

export function useDraggable(): UseDraggableReturn {
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const wasDragRef = useRef(false);
  const [wasDrag, setWasDrag] = useState(false);
  const dragStateRef = useRef<DragState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    hasMoved: false,
  });
  const elementRef = useRef<HTMLElement | null>(null);

  // Load persisted corner on mount
  useEffect(() => {
    setCorner(getStoredCorner());
  }, []);

  const getNearestCorner = useCallback((x: number, y: number): Corner => {
    const midX = globalThis.innerWidth / 2;
    const midY = globalThis.innerHeight / 2;
    const isRight = x >= midX;
    const isBottom = y >= midY;

    if (isBottom && isRight) return "bottom-right";
    if (isBottom && !isRight) return "bottom-left";
    if (!isBottom && isRight) return "top-right";
    return "top-left";
  }, []);

  const handleDragStart = useCallback((clientX: number, clientY: number, target: EventTarget) => {
    elementRef.current = target as HTMLElement;
    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      isDragging: true,
      hasMoved: false,
    };
    wasDragRef.current = false;
    setWasDrag(false);
  }, []);

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      const state = dragStateRef.current;
      if (!state.isDragging) return;

      const dx = Math.abs(clientX - state.startX);
      const dy = Math.abs(clientY - state.startY);

      if (!state.hasMoved && dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }

      state.hasMoved = true;
      state.currentX = clientX;
      state.currentY = clientY;
      wasDragRef.current = true;

      if (!isDragging) {
        setIsDragging(true);
      }

      // Calculate position: center the element on the cursor
      const el = elementRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const halfW = rect.width / 2;
      const halfH = rect.height / 2;

      // Clamp within viewport
      const x = Math.max(halfW, Math.min(clientX, globalThis.innerWidth - halfW));
      const y = Math.max(halfH, Math.min(clientY, globalThis.innerHeight - halfH));

      setDragPosition({ x, y });
    },
    [isDragging],
  );

  const handleDragEnd = useCallback(() => {
    const state = dragStateRef.current;
    state.isDragging = false;

    if (!state.hasMoved) {
      setIsDragging(false);
      setDragPosition(null);
      return;
    }

    setWasDrag(true);

    // Calculate nearest corner from last position
    const newCorner = getNearestCorner(state.currentX, state.currentY);
    setCorner(newCorner);
    storeCorner(newCorner);

    // Trigger snap animation
    setIsSnapping(true);
    setIsDragging(false);
    setDragPosition(null);

    setTimeout(() => {
      setIsSnapping(false);
    }, SNAP_DURATION);
  }, [getNearestCorner]);

  // Mouse move/up listeners (added to window during drag)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => {
      handleDragEnd();
    };

    if (isDragging) {
      globalThis.addEventListener("mousemove", onMouseMove);
      globalThis.addEventListener("mouseup", onMouseUp);
    }

    return () => {
      globalThis.removeEventListener("mousemove", onMouseMove);
      globalThis.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY, e.currentTarget);
    },
    [handleDragStart],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
      if (dragStateRef.current.hasMoved) {
        e.preventDefault();
      }
    },
    [handleDragMove],
  );

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left mouse button
      if (e.button !== 0) return;
      handleDragStart(e.clientX, e.clientY, e.currentTarget);
    },
    [handleDragStart],
  );

  // Compute inline drag style
  const dragStyle: React.CSSProperties | undefined = dragPosition
    ? {
        position: "fixed" as const,
        left: `${dragPosition.x}px`,
        top: `${dragPosition.y}px`,
        transform: "translate(-50%, -50%)",
        transition: "none",
      }
    : undefined;

  return {
    corner,
    isDragging,
    isSnapping,
    dragStyle,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
    },
    wasDrag,
  };
}
