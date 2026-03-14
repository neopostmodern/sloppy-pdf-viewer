import React from "react";
import { Box, Tab, Tabs } from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ListIcon from "@mui/icons-material/List";
import { usePdf } from "../context/PdfContext";
import ThumbnailPanel from "./ThumbnailPanel";
import OutlinePanel from "./OutlinePanel";

export default function Sidebar() {
  const { sidebarOpen, sidebarTab, setSidebarTab } = usePdf();

  if (!sidebarOpen) return null;

  return (
    <Box
      data-testid="sidebar"
      id="sidebar"
      sx={{
        width: 220,
        bgcolor: "#2a2a2e",
        borderRight: "1px solid #1a1a1e",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid #1a1a1e" }}>
        <Tabs
          value={sidebarTab}
          onChange={(_, val) => setSidebarTab(val)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": {
              minHeight: 36,
              color: "#999",
              "&.Mui-selected": { color: "#4fc3f7" },
            },
            "& .MuiTabs-indicator": { bgcolor: "#4fc3f7" },
          }}
        >
          <Tab
            value="thumbnails"
            icon={<GridViewIcon fontSize="small" />}
            data-testid="tabThumbnails"
            id="tabThumbnails"
            title="Thumbnails"
            sx={{ minWidth: 0 }}
          />
          <Tab
            value="outline"
            icon={<ListIcon fontSize="small" />}
            data-testid="tabOutline"
            id="tabOutline"
            title="Document Outline"
            sx={{ minWidth: 0 }}
          />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", p: 1 }}>
        {sidebarTab === "thumbnails" && <ThumbnailPanel />}
        {sidebarTab === "outline" && <OutlinePanel />}
      </Box>
    </Box>
  );
}
