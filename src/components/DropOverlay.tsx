import React from "react";
import { Box, Typography } from "@mui/material";

export default function DropOverlay() {
  return (
    <Box
      id="dropOverlay"
      data-testid="dropOverlay"
      sx={{
        display: "none",
        position: "fixed",
        inset: 0,
        zIndex: 300,
        bgcolor: "rgba(0, 120, 215, 0.15)",
        border: "3px dashed #4fc3f7",
        borderRadius: 3,
        m: 1,
        color: "#4fc3f7",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        "body.drag-hover &": {
          display: "flex",
        },
      }}
    >
      <Typography variant="h5">Drop PDF here</Typography>
    </Box>
  );
}
