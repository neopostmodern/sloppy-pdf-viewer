import React, { useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import { usePdf } from "../context/PdfContext";

export default function PdfViewerContainer() {
  const {
    initializeViewer,
    handToolActive,
    zoomIn,
    zoomOut,
  } = usePdf();

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Initialize pdf.js viewer when container mounts
  useEffect(() => {
    if (containerRef.current) {
      initializeViewer(containerRef.current);
    }
  }, [initializeViewer]);

  // Ctrl+wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoomIn, zoomOut]);

  // Hand tool panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!handToolActive || e.button !== 0) return;
      isPanningRef.current = true;
      const el = containerRef.current!;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
    },
    [handToolActive]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      const el = containerRef.current!;
      el.scrollLeft =
        panStartRef.current.scrollLeft - (e.clientX - panStartRef.current.x);
      el.scrollTop =
        panStartRef.current.scrollTop - (e.clientY - panStartRef.current.y);
    };

    const handleMouseUp = () => {
      isPanningRef.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <Box sx={{ flex: 1, position: "relative", minWidth: 0 }}>
      <Box
        ref={containerRef}
        id="viewerContainer"
        data-testid="viewerContainer"
        className={handToolActive ? "hand-tool" : ""}
        onMouseDown={handleMouseDown}
        sx={{
          position: "absolute",
          inset: 0,
          overflow: "auto",
          bgcolor: "#525659",
          cursor: handToolActive ? "grab" : undefined,
          "&:active": {
            cursor: handToolActive ? "grabbing" : undefined,
          },
          "& .textLayer": {
            pointerEvents: handToolActive ? "none" : undefined,
          },
        }}
      >
        <div id="viewer" className="pdfViewer" />
      </Box>
    </Box>
  );
}
