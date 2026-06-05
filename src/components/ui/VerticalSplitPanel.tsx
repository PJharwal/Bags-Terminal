"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface VerticalSplitPanelProps {
  topPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
  initialTopHeight?: number; // in pixels
  minTopHeight?: number; // in pixels
  minBottomHeight?: number; // in pixels
}

export function VerticalSplitPanel({
  topPanel,
  bottomPanel,
  initialTopHeight = 450,
  minTopHeight = 150,
  minBottomHeight = 150,
}: VerticalSplitPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topHeight, setTopHeight] = useState<number>(initialTopHeight);
  const [isDragging, setIsDragging] = useState(false);

  const startDragY = useRef(0);
  const startHeight = useRef(0);
  const containerHeightRef = useRef<number>(0);
  const ratioRef = useRef<number>(0.6); // Default split ratio

  // Responsive scaling when the container resizes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newContainerHeight = entry.contentRect.height;
        const oldContainerHeight = containerHeightRef.current;
        containerHeightRef.current = newContainerHeight;

        if (newContainerHeight <= 0) return;

        setTopHeight((prev) => {
          const splitterHeight = 6;
          const maxAllowed = newContainerHeight - minBottomHeight - splitterHeight;

          if (oldContainerHeight === 0) {
            const target = Math.max(minTopHeight, Math.min(maxAllowed, initialTopHeight));
            ratioRef.current = target / newContainerHeight;
            return target;
          } else {
            const target = Math.max(minTopHeight, Math.min(maxAllowed, ratioRef.current * newContainerHeight));
            return target;
          }
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [initialTopHeight, minTopHeight, minBottomHeight]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startDragY.current = e.clientY;
      startHeight.current = topHeight;
    },
    [topHeight]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      startDragY.current = e.touches[0].clientY;
      startHeight.current = topHeight;
    },
    [topHeight]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const deltaY = e.clientY - startDragY.current;
      const containerHeight = containerRef.current.getBoundingClientRect().height;
      const splitterHeight = 6;

      const maxTopHeight = containerHeight - minBottomHeight - splitterHeight;
      const newHeight = Math.max(minTopHeight, Math.min(maxTopHeight, startHeight.current + deltaY));
      setTopHeight(newHeight);
      ratioRef.current = newHeight / containerHeight;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const deltaY = e.touches[0].clientY - startDragY.current;
      const containerHeight = containerRef.current.getBoundingClientRect().height;
      const splitterHeight = 6;

      const maxTopHeight = containerHeight - minBottomHeight - splitterHeight;
      const newHeight = Math.max(minTopHeight, Math.min(maxTopHeight, startHeight.current + deltaY));
      setTopHeight(newHeight);
      ratioRef.current = newHeight / containerHeight;
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onMouseUp);

    // Override global cursor and selection during drag to avoid stuttering
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, minTopHeight, minBottomHeight]);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-h-0 w-full h-full relative overflow-hidden">
      {/* 
        Transparent overlay to block iframe pointer events during drag.
        This prevents the embedded chart iframe from swallowing mousemove events when dragging upwards.
      */}
      {isDragging && (
        <div className="absolute inset-0 z-50 cursor-row-resize bg-transparent select-none" />
      )}

      {/* Top Panel */}
      <div
        style={{ height: `${topHeight}px` }}
        className="w-full min-h-0 overflow-hidden shrink-0"
      >
        {topPanel}
      </div>

      {/* Splitter Bar */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className={`w-full h-[6px] shrink-0 cursor-row-resize flex items-center justify-center transition-colors select-none ${
          isDragging ? "bg-[#39FF14]/25" : "bg-[#14151b] hover:bg-[#39FF14]/15"
        } border-y border-[#1d1f26]`}
      >
        {/* Subtle grab indicator */}
        <div className={`w-8 h-[2px] rounded-full transition-colors ${isDragging ? "bg-[#39FF14]" : "bg-neutral-600"}`} />
      </div>

      {/* Bottom Panel */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        {bottomPanel}
      </div>
    </div>
  );
}
