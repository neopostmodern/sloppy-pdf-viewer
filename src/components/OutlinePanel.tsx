import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { usePdf } from "../context/PdfContext";

interface OutlineItem {
  title: string;
  dest: any;
  items?: OutlineItem[];
}

export default function OutlinePanel() {
  const { pdfDocument, linkServiceRef } = usePdf();
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!pdfDocument) {
      setOutline(null);
      setLoaded(false);
      return;
    }

    let cancelled = false;
    pdfDocument.getOutline().then((result: OutlineItem[] | null) => {
      if (!cancelled) {
        setOutline(result && result.length > 0 ? result : null);
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [pdfDocument]);

  if (!loaded) return null;

  if (!outline) {
    return (
      <Box data-testid="outlineView" id="outlineView">
        <Typography
          className="outline-empty"
          sx={{
            color: "#666",
            fontStyle: "italic",
            p: 2,
            fontSize: 12,
          }}
        >
          No outline available
        </Typography>
      </Box>
    );
  }

  function renderItems(items: OutlineItem[], depth: number): React.ReactNode {
    return items.map((item, idx) => (
      <React.Fragment key={`${depth}-${idx}`}>
        <Box
          component="button"
          className="outline-item"
          onClick={() => {
            if (item.dest) {
              linkServiceRef.current?.goToDestination(item.dest);
            }
          }}
          sx={{
            display: "block",
            width: "100%",
            pl: `${8 + depth * 16}px`,
            pr: 1,
            py: 0.5,
            bgcolor: "transparent",
            color: "#b0b0b0",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            textAlign: "left",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.06)",
              color: "#e0e0e0",
            },
          }}
        >
          {item.title}
        </Box>
        {item.items && item.items.length > 0 && renderItems(item.items, depth + 1)}
      </React.Fragment>
    ));
  }

  return (
    <Box data-testid="outlineView" id="outlineView">
      {renderItems(outline, 0)}
    </Box>
  );
}
