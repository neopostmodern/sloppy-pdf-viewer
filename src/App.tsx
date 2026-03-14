import React, { useEffect } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import theme from "./theme";
import { PdfProvider, usePdf } from "./context/PdfContext";
import Toolbar from "./components/Toolbar";
import FindBar from "./components/FindBar";
import Sidebar from "./components/Sidebar";
import PdfViewerContainer from "./components/PdfViewerContainer";
import DocumentPropertiesDialog from "./components/DocumentPropertiesDialog";
import DropOverlay from "./components/DropOverlay";

function AppContent() {
  const {
    pdfDocument,
    toggleFindbar,
    findbarOpen,
    openFileDialog,
    saveFile,
    zoomIn,
    zoomOut,
    setScale,
    goToFirstPage,
    goToLastPage,
    rotateCw,
    rotateCcw,
    nextPage,
    previousPage,
    propertiesOpen,
    closeProperties,
    secondaryToolbarOpen,
    closeSecondaryToolbar,
  } = usePdf();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA";

      // Ctrl shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "o":
            e.preventDefault();
            openFileDialog();
            return;
          case "s":
            e.preventDefault();
            saveFile();
            return;
          case "f":
            e.preventDefault();
            toggleFindbar(true);
            return;
          case "=":
          case "+":
            e.preventDefault();
            zoomIn();
            return;
          case "-":
            e.preventDefault();
            zoomOut();
            return;
          case "0":
            e.preventDefault();
            setScale("auto");
            return;
        }
      }

      if (e.key === "Escape") {
        if (findbarOpen) {
          toggleFindbar(false);
          return;
        }
        if (propertiesOpen) {
          closeProperties();
          return;
        }
        if (secondaryToolbarOpen) {
          closeSecondaryToolbar();
          return;
        }
        if (document.fullscreenElement) {
          document.exitFullscreen();
          return;
        }
      }

      if (isInput) return;

      switch (e.key) {
        case "Home":
          goToFirstPage();
          break;
        case "End":
          goToLastPage();
          break;
        case "r":
          rotateCw();
          break;
        case "R":
          rotateCcw();
          break;
        case "j":
        case "n":
          nextPage();
          break;
        case "k":
        case "p":
          previousPage();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    findbarOpen,
    propertiesOpen,
    secondaryToolbarOpen,
    toggleFindbar,
    openFileDialog,
    saveFile,
    zoomIn,
    zoomOut,
    setScale,
    goToFirstPage,
    goToLastPage,
    rotateCw,
    rotateCcw,
    nextPage,
    previousPage,
    closeProperties,
    closeSecondaryToolbar,
  ]);

  return (
    <>
      <Toolbar />
      <FindBar />
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <Sidebar />
        <PdfViewerContainer />
      </Box>
      <DocumentPropertiesDialog />
      <DropOverlay />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PdfProvider>
        <AppContent />
      </PdfProvider>
    </ThemeProvider>
  );
}
