import React, { useState, useRef } from "react";
import {
  AppBar,
  Toolbar as MuiToolbar,
  IconButton,
  Box,
  Select,
  MenuItem,
  TextField,
  Divider,
  SelectChangeEvent,
} from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveIcon from "@mui/icons-material/Save";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { usePdf } from "../context/PdfContext";
import SecondaryToolbarMenu from "./SecondaryToolbarMenu";

export default function Toolbar() {
  const {
    currentPage,
    numPages,
    scaleValue,
    customScaleText,
    nextPage,
    previousPage,
    goToPage,
    zoomIn,
    zoomOut,
    setScale,
    toggleFindbar,
    toggleSidebar,
    openFileDialog,
    saveFile,
    secondaryToolbarOpen,
    toggleSecondaryToolbar,
  } = usePdf();

  const [pageInputValue, setPageInputValue] = useState("");
  const pageInputRef = useRef<HTMLInputElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  // Sync page input display with current page from context
  const displayValue = pageInputValue !== "" ? pageInputValue : String(currentPage);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const num = parseInt(pageInputValue || displayValue, 10);
      if (num >= 1 && num <= numPages) {
        goToPage(num);
      }
      setPageInputValue("");
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePageInputBlur = () => {
    setPageInputValue("");
  };

  const handleScaleChange = (e: SelectChangeEvent<string>) => {
    setScale(e.target.value);
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid #1a1a1e",
        flexShrink: 0,
        minHeight: "36px !important",
      }}
    >
      <MuiToolbar
        variant="dense"
        sx={{
          minHeight: "36px !important",
          px: 1,
          gap: 0.5,
          justifyContent: "space-between",
        }}
      >
        {/* Left section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <IconButton
            size="small"
            onClick={toggleSidebar}
            data-testid="sidebarToggle"
            title="Toggle Sidebar"
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: "#555" }} />

          <IconButton
            size="small"
            onClick={() => toggleFindbar()}
            data-testid="viewFind"
            title="Find in Document (Ctrl+F)"
          >
            <SearchIcon fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: "#555" }} />

          <IconButton
            size="small"
            onClick={previousPage}
            data-testid="previous"
            title="Previous Page"
          >
            <NavigateBeforeIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TextField
              inputRef={pageInputRef}
              data-testid="pageNumber"
              value={displayValue}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              onBlur={handlePageInputBlur}
              size="small"
              type="number"
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: numPages,
                  id: "pageNumber",
                  style: {
                    width: 36,
                    textAlign: "center",
                    padding: "3px 4px",
                    fontSize: 13,
                    MozAppearance: "textfield",
                  },
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#1c1c1e",
                  "& fieldset": { borderColor: "#555" },
                  "&:hover fieldset": { borderColor: "#555" },
                  "&.Mui-focused fieldset": { borderColor: "#0078d7" },
                },
                "& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button": {
                  WebkitAppearance: "none",
                },
              }}
            />
            <Box component="span" sx={{ fontSize: 13, whiteSpace: "nowrap" }}>
              / <span data-testid="numPages" id="numPages">{numPages}</span>
            </Box>
          </Box>

          <IconButton
            size="small"
            onClick={nextPage}
            data-testid="next"
            title="Next Page"
          >
            <NavigateNextIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Center section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <IconButton
            size="small"
            onClick={zoomOut}
            data-testid="zoomOut"
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>

          <Select
            data-testid="scaleSelect"
            value={scaleValue}
            onChange={handleScaleChange}
            size="small"
            sx={{
              minWidth: 120,
              fontSize: 13,
              bgcolor: "#1c1c1e",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#555" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#555" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0078d7" },
              "& .MuiSelect-select": { py: "3px", px: "6px" },
            }}
            inputProps={{ id: "scaleSelect" }}
            renderValue={(val) => {
              if (val === "custom") return customScaleText;
              const labels: Record<string, string> = {
                auto: "Automatic Zoom",
                "page-fit": "Page Fit",
                "page-width": "Page Width",
                "page-actual": "Actual Size",
                "0.5": "50%",
                "0.75": "75%",
                "1": "100%",
                "1.25": "125%",
                "1.5": "150%",
                "2": "200%",
                "3": "300%",
                "4": "400%",
              };
              return labels[val] || val;
            }}
          >
            <MenuItem value="auto">Automatic Zoom</MenuItem>
            <MenuItem value="page-fit">Page Fit</MenuItem>
            <MenuItem value="page-width">Page Width</MenuItem>
            <MenuItem value="page-actual">Actual Size</MenuItem>
            {scaleValue === "custom" && (
              <MenuItem value="custom" disabled sx={{ display: "none" }}>
                {customScaleText}
              </MenuItem>
            )}
            <MenuItem value="0.5">50%</MenuItem>
            <MenuItem value="0.75">75%</MenuItem>
            <MenuItem value="1">100%</MenuItem>
            <MenuItem value="1.25">125%</MenuItem>
            <MenuItem value="1.5">150%</MenuItem>
            <MenuItem value="2">200%</MenuItem>
            <MenuItem value="3">300%</MenuItem>
            <MenuItem value="4">400%</MenuItem>
          </Select>

          <IconButton
            size="small"
            onClick={zoomIn}
            data-testid="zoomIn"
            title="Zoom In (Ctrl+=)"
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Right section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <IconButton
            size="small"
            onClick={() => document.documentElement.requestFullscreen?.()}
            data-testid="presentationMode"
            title="Presentation Mode"
          >
            <SlideshowIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={openFileDialog}
            data-testid="openFile"
            title="Open File (Ctrl+O)"
          >
            <FolderOpenIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={saveFile}
            data-testid="download"
            title="Save (Ctrl+S)"
          >
            <SaveIcon fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: "#555" }} />

          <Box sx={{ position: "relative" }}>
            <IconButton
              ref={toolsButtonRef}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleSecondaryToolbar();
              }}
              data-testid="secondaryToolbarToggle"
              title="Tools"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>

            <SecondaryToolbarMenu
              anchorEl={toolsButtonRef.current}
              open={secondaryToolbarOpen}
            />
          </Box>
        </Box>
      </MuiToolbar>
    </AppBar>
  );
}
