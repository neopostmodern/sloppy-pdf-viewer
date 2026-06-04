import React, { useEffect, useRef, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { usePdf } from "../context/PdfContext";

const THUMB_WIDTH = 150;

interface ThumbnailData {
  pageNum: number;
  dataUrl: string | null;
  width: number;
  height: number;
}

export default function ThumbnailPanel() {
  const { pdfDocument, currentPage, goToPage } = usePdf();
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfDocument) {
      setThumbnails([]);
      return;
    }

    let cancelled = false;

    async function buildThumbnails() {
      // First pass: collect all page sizes and show skeletons immediately
      const skeletons: ThumbnailData[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        if (cancelled) return;
        const page = await pdfDocument.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        const scale = THUMB_WIDTH / vp.width;
        const viewport = page.getViewport({ scale });
        skeletons.push({ pageNum: i, dataUrl: null, width: viewport.width, height: viewport.height });
      }
      if (cancelled) return;
      setThumbnails([...skeletons]);

      // Second pass: render each thumbnail and stream in
      for (let i = 0; i < skeletons.length; i++) {
        if (cancelled) return;
        const { pageNum, width, height } = skeletons[i];
        const page = await pdfDocument.getPage(pageNum);
        const scale = THUMB_WIDTH / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;

        if (cancelled) return;
        const dataUrl = canvas.toDataURL();
        setThumbnails((prev) => {
          const next = [...prev];
          next[i] = { pageNum, dataUrl, width, height };
          return next;
        });
      }
    }

    buildThumbnails();
    return () => { cancelled = true; };
  }, [pdfDocument]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!containerRef.current) return;
    const active = containerRef.current.querySelector(`[data-page="${currentPage}"]`);
    if (active) active.scrollIntoView({ block: "nearest" });
  }, [currentPage]);

  return (
    <Box ref={containerRef} data-testid="thumbnailView" id="thumbnailView">
      {thumbnails.map((t) => (
        <Box
          key={t.pageNum}
          data-page={t.pageNum}
          className={`thumbnail-item${t.pageNum === currentPage ? " active" : ""}`}
          onClick={() => goToPage(t.pageNum)}
          sx={{
            cursor: "pointer",
            mb: 1,
            border: "2px solid",
            borderColor: t.pageNum === currentPage ? "#4fc3f7" : "transparent",
            borderRadius: "3px",
            p: 0.25,
            textAlign: "center",
            "&:hover": {
              borderColor: t.pageNum === currentPage ? "#4fc3f7" : "#666",
            },
          }}
        >
          {t.dataUrl ? (
            <Box
              component="img"
              src={t.dataUrl}
              sx={{
                display: "block",
                mx: "auto",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.4)",
                maxWidth: "100%",
              }}
            />
          ) : (
            <Skeleton
              variant="rectangular"
              width={t.width}
              height={t.height}
              sx={{ mx: "auto", maxWidth: "100%", bgcolor: "rgba(255,255,255,0.1)" }}
            />
          )}
          <Typography
            variant="caption"
            className="thumbnail-label"
            sx={{ color: "#999", mt: 0.25, display: "block" }}
          >
            {t.pageNum}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
