import React, { useRef, useEffect } from "react";
import {
  Box,
  IconButton,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Divider,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CloseIcon from "@mui/icons-material/Close";
import { usePdf } from "../context/PdfContext";

export default function FindBar() {
  const {
    findbarOpen,
    toggleFindbar,
    dispatchFind,
    findResultsCount,
    findMessage,
    findOptionsRef,
    findQueryRef,
  } = usePdf();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (findbarOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [findbarOpen]);

  if (!findbarOpen) return null;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    findQueryRef.current = e.target.value;
    dispatchFind();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        dispatchFind("findagain", true);
      } else {
        dispatchFind("findagain");
      }
    } else if (e.key === "Escape") {
      toggleFindbar(false);
    }
  };

  const handleOptionChange = (key: keyof typeof findOptionsRef.current) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      findOptionsRef.current[key] = e.target.checked;
      if (findQueryRef.current) dispatchFind("findagain");
    };
  };

  return (
    <Box
      data-testid="findbar"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1,
        py: 0.5,
        bgcolor: "background.paper",
        borderBottom: "1px solid #1a1a1e",
        flexShrink: 0,
      }}
    >
      <TextField
        inputRef={inputRef}
        data-testid="findInput"
        placeholder="Find in document…"
        size="small"
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        slotProps={{
          htmlInput: {
            id: "findInput",
            style: { padding: "4px 8px", fontSize: 13, width: 180 },
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            bgcolor: "#1c1c1e",
            "& fieldset": { borderColor: "#555" },
            "&.Mui-focused fieldset": { borderColor: "#0078d7" },
          },
        }}
      />

      <IconButton
        size="small"
        onClick={() => dispatchFind("findagain", true)}
        data-testid="findPrevious"
        title="Previous Match (Shift+Enter)"
      >
        <KeyboardArrowUpIcon fontSize="small" />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => dispatchFind("findagain")}
        data-testid="findNext"
        title="Next Match (Enter)"
      >
        <KeyboardArrowDownIcon fontSize="small" />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ borderColor: "#555" }} />

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            data-testid="findHighlightAll"
            id="findHighlightAll"
            onChange={handleOptionChange("highlightAll")}
            sx={{ p: 0.25, color: "#b0b0b0", "&.Mui-checked": { color: "#0078d7" } }}
          />
        }
        label="Highlight All"
        sx={{ mx: 0, "& .MuiFormControlLabel-label": { fontSize: 12, color: "#b0b0b0" } }}
      />

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            data-testid="findMatchCase"
            id="findMatchCase"
            onChange={handleOptionChange("caseSensitive")}
            sx={{ p: 0.25, color: "#b0b0b0", "&.Mui-checked": { color: "#0078d7" } }}
          />
        }
        label="Match Case"
        sx={{ mx: 0, "& .MuiFormControlLabel-label": { fontSize: 12, color: "#b0b0b0" } }}
      />

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            data-testid="findEntireWord"
            id="findEntireWord"
            onChange={handleOptionChange("entireWord")}
            sx={{ p: 0.25, color: "#b0b0b0", "&.Mui-checked": { color: "#0078d7" } }}
          />
        }
        label="Whole Words"
        sx={{ mx: 0, "& .MuiFormControlLabel-label": { fontSize: 12, color: "#b0b0b0" } }}
      />

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            data-testid="findMatchDiacritics"
            id="findMatchDiacritics"
            onChange={handleOptionChange("matchDiacritics")}
            sx={{ p: 0.25, color: "#b0b0b0", "&.Mui-checked": { color: "#0078d7" } }}
          />
        }
        label="Match Diacritics"
        sx={{ mx: 0, "& .MuiFormControlLabel-label": { fontSize: 12, color: "#b0b0b0" } }}
      />

      <Typography
        variant="caption"
        data-testid="findResultsCount"
        id="findResultsCount"
        sx={{ color: "#a0a0a0", whiteSpace: "nowrap" }}
      >
        {findResultsCount}
      </Typography>

      <Typography
        variant="caption"
        data-testid="findMsg"
        id="findMsg"
        sx={{ color: "#ff6b6b", whiteSpace: "nowrap" }}
      >
        {findMessage}
      </Typography>

      <Box sx={{ flex: 1 }} />

      <IconButton
        size="small"
        onClick={() => toggleFindbar(false)}
        data-testid="findClose"
        title="Close (Escape)"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
