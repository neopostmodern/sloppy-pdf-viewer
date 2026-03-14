import React, { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { usePdf } from "../context/PdfContext";

interface ThumbnailData {
  pageNum: number;
  dataUrl: string;
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
      const result: ThumbnailData[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        if (cancelled) return;
        const page = await pdfDocument.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        const thumbWidth = 150;
        const scale = thumbWidth / vp.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        result.push({
          pageNum: i,
          dataUrl: canvas.toDataURL(),
          width: viewport.width,
          height: viewport.height,
        });
      }
      if (!cancelled) setThumbnails(result);
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
