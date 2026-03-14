import React from "react";
import {
  Menu,
  MenuItem,
  Divider,
  ListItemText,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { usePdf } from "../context/PdfContext";

interface SecondaryToolbarMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
}

export default function SecondaryToolbarMenu({
  anchorEl,
  open,
}: SecondaryToolbarMenuProps) {
  const {
    closeSecondaryToolbar,
    goToFirstPage,
    goToLastPage,
    rotateCw,
    rotateCcw,
    handToolActive,
    setHandTool,
    scrollMode,
    setScrollMode,
    spreadMode,
    setSpreadMode,
    openProperties,
  } = usePdf();

  const handleAction = (action: () => void) => {
    action();
    closeSecondaryToolbar();
  };

  const toggledSx = {
    color: "#4fc3f7",
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={closeSecondaryToolbar}
      data-testid="secondaryToolbar"
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          id: "secondaryToolbar",
          sx: {
            bgcolor: "#2a2a2e",
            border: "1px solid #555",
            borderRadius: "6px",
            minWidth: 220,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
          },
        },
      }}
    >
      <MenuItem
        onClick={() => handleAction(goToFirstPage)}
        data-testid="firstPage"
        id="firstPage"
      >
        <ListItemText>Go to First Page</ListItemText>
        <Typography variant="caption" sx={{ color: "#888", ml: 2 }}>Home</Typography>
      </MenuItem>
      <MenuItem
        onClick={() => handleAction(goToLastPage)}
        data-testid="lastPage"
        id="lastPage"
      >
        <ListItemText>Go to Last Page</ListItemText>
        <Typography variant="caption" sx={{ color: "#888", ml: 2 }}>End</Typography>
      </MenuItem>

      <Divider sx={{ borderColor: "#555" }} />

      <MenuItem
        onClick={() => handleAction(rotateCw)}
        data-testid="pageRotateCw"
        id="pageRotateCw"
      >
        <ListItemText>Rotate Clockwise</ListItemText>
        <Typography variant="caption" sx={{ color: "#888", ml: 2 }}>R</Typography>
      </MenuItem>
      <MenuItem
        onClick={() => handleAction(rotateCcw)}
        data-testid="pageRotateCcw"
        id="pageRotateCcw"
      >
        <ListItemText>Rotate Counter-Clockwise</ListItemText>
        <Typography variant="caption" sx={{ color: "#888", ml: 2 }}>Shift+R</Typography>
      </MenuItem>

      <Divider sx={{ borderColor: "#555" }} />

      <MenuItem
        onClick={() => handleAction(() => setHandTool(false))}
        data-testid="cursorSelectTool"
        id="cursorSelectTool"
        sx={!handToolActive ? toggledSx : undefined}
      >
        {!handToolActive && <CheckIcon sx={{ fontSize: 14, mr: 1 }} />}
        <ListItemText>Text Selection Tool</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => handleAction(() => setHandTool(true))}
        data-testid="cursorHandTool"
        id="cursorHandTool"
        sx={handToolActive ? toggledSx : undefined}
      >
        {handToolActive && <CheckIcon sx={{ fontSize: 14, mr: 1 }} />}
        <ListItemText>Hand Tool</ListItemText>
      </MenuItem>

      <Divider sx={{ borderColor: "#555" }} />

      <MenuItem
        onClick={() => handleAction(() => setScrollMode(0))}
        data-testid="scrollVertical"
        id="scrollVertical"
        sx={scrollMode === 0 ? toggledSx : undefined}
      >
        {scrollMode === 0 && <CheckIcon sx={{ fontSize: 14, mr: 1 }} />}
        <ListItemText>Vertical Scrolling</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => handleAction(() => setScrollMode(1))}
        data-testid="scrollHorizontal"
        id="scrollHorizontal"
        sx={scrollMode === 1 ? toggledSx : undefined}
      >
        {scrollMode === 1 && <CheckIcon sx={{ fontSize: 14, mr: 1 }} />}
        <ListItemText>Horizontal Scrolling</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => handleAction(() => setScrollMode(2))}
        data-testid="scrollWrapped"
        id="scrollWrapped"
        sx={scrollMode === 2 ? toggledSx : undefined}
      >
        {scrollMode === 2 && <CheckIcon sx={{ fontSize: 14, mr: 1 }} />}
        <ListItemText>Wrapped Scrolling</ListItemText>
      </MenuItem>

      <Divider sx={{ borderColor: "#555" }} />

      <MenuItem
        onClick={() => handleAction(() => setSpreadMode(0))}
        data-testid="spreadNone"
        id="spreadNone"
        sx={spreadMode === 0 ? toggledSx : undefined}
      >
        {spreadMode === 0 && <CheckIcon sx={{ fontSize: 14, mr: 1 }} />}
        <ListItemText>No Spreads</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => handleAction(() => setSpreadMode(1))}
        data-testid="spreadOdd"
        id="spreadOdd"
        sx={spreadMode === 1 ? toggledSx : undefined}
      >
        {spreadMode === 1 && <CheckIcon sx={{ fontSize: 14, mr: 1 }} />}
        <ListItemText>Odd Spreads</ListItemText>
      </MenuItem>
      <MenuItem
        onClick={() => handleAction(() => setSpreadMode(2))}
        data-testid="spreadEven"
        id="spreadEven"
        sx={spreadMode === 2 ? toggledSx : undefined}
      >
        {spreadMode === 2 && <CheckIcon sx={{ fontSize: 14, mr: 1 }} />}
        <ListItemText>Even Spreads</ListItemText>
      </MenuItem>

      <Divider sx={{ borderColor: "#555" }} />

      <MenuItem
        onClick={() => handleAction(openProperties)}
        data-testid="documentProperties"
        id="documentProperties"
      >
        <ListItemText>Document Properties…</ListItemText>
      </MenuItem>
    </Menu>
  );
}
