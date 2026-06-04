import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  EventBus,
  PDFViewer,
  PDFLinkService,
  PDFFindController,
} from "pdfjs-dist/web/pdf_viewer.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

// ── Types ──

interface FindOptions {
  caseSensitive: boolean;
  entireWord: boolean;
  highlightAll: boolean;
  matchDiacritics: boolean;
}

interface PdfContextValue {
  // State
  pdfDocument: any;
  currentPage: number;
  numPages: number;
  scaleValue: string;
  customScaleText: string;
  findResultsCount: string;
  findMessage: string;
  findbarOpen: boolean;
  sidebarOpen: boolean;
  sidebarTab: "thumbnails" | "outline";
  secondaryToolbarOpen: boolean;
  propertiesOpen: boolean;
  handToolActive: boolean;
  scrollMode: number;
  spreadMode: number;

  // Refs
  viewerContainerRef: React.RefObject<HTMLDivElement | null>;
  viewerRef: React.RefObject<PDFViewer | null>;
  eventBusRef: React.RefObject<EventBus | null>;
  linkServiceRef: React.RefObject<PDFLinkService | null>;
  findControllerRef: React.RefObject<PDFFindController | null>;

  // File operations
  openPdf: (filePath: string) => Promise<void>;
  openFileDialog: () => Promise<void>;
  saveFile: () => Promise<void>;
  currentFilePath: string | null;
  currentFileBytes: Uint8Array | null;

  // Navigation
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;

  // Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  setScale: (value: string) => void;

  // Rotation
  rotateCw: () => void;
  rotateCcw: () => void;

  // Find
  toggleFindbar: (show?: boolean) => void;
  dispatchFind: (type?: string, findPrevious?: boolean) => void;
  findOptionsRef: React.RefObject<FindOptions>;
  findQueryRef: React.RefObject<string>;

  // Sidebar
  toggleSidebar: () => void;
  setSidebarTab: (tab: "thumbnails" | "outline") => void;

  // Secondary toolbar
  toggleSecondaryToolbar: () => void;
  closeSecondaryToolbar: () => void;

  // Tools
  setHandTool: (active: boolean) => void;
  setScrollMode: (mode: number) => void;
  setSpreadMode: (mode: number) => void;

  // Properties
  openProperties: () => void;
  closeProperties: () => void;

  // Initialization
  initializeViewer: (container: HTMLDivElement) => void;
}

const PdfContext = createContext<PdfContextValue | null>(null);

export function usePdf() {
  const ctx = useContext(PdfContext);
  if (!ctx) throw new Error("usePdf must be used within PdfProvider");
  return ctx;
}

export function PdfProvider({ children }: { children: React.ReactNode }) {
  // ── State ──
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scaleValue, setScaleValue] = useState("auto");
  const [customScaleText, setCustomScaleText] = useState("");
  const [findResultsCount, setFindResultsCount] = useState("");
  const [findMessage, setFindMessage] = useState("");
  const [findbarOpen, setFindbarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"thumbnails" | "outline">("thumbnails");
  const [secondaryToolbarOpen, setSecondaryToolbarOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [handToolActive, setHandToolActive] = useState(false);
  const [scrollMode, setScrollModeState] = useState(0);
  const [spreadMode, setSpreadModeState] = useState(0);

  // ── Refs ──
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<PDFViewer | null>(null);
  const eventBusRef = useRef<EventBus | null>(null);
  const linkServiceRef = useRef<PDFLinkService | null>(null);
  const findControllerRef = useRef<PDFFindController | null>(null);
  const currentFilePathRef = useRef<string | null>(null);
  const currentFileBytesRef = useRef<Uint8Array | null>(null);
  const pdfDocumentRef = useRef<any>(null);
  const findOptionsRef = useRef<FindOptions>({
    caseSensitive: false,
    entireWord: false,
    highlightAll: true,
    matchDiacritics: false,
  });
  const findQueryRef = useRef<string>("");
  const initializedRef = useRef(false);

  // Keep doc ref in sync
  useEffect(() => {
    pdfDocumentRef.current = pdfDocument;
  }, [pdfDocument]);

  // ── Initialize PDF.js viewer ──
  const initializeViewer = useCallback((container: HTMLDivElement) => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    viewerContainerRef.current = container;

    const eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus });
    const findController = new PDFFindController({ eventBus, linkService });

    const viewer = new PDFViewer({
      container,
      eventBus,
      linkService,
      findController,
      textLayerMode: 2,
      annotationMode: 2,
      removePageBorders: false,
    });

    linkService.setViewer(viewer);
    viewer.currentScaleValue = "auto";

    eventBusRef.current = eventBus;
    linkServiceRef.current = linkService;
    findControllerRef.current = findController;
    viewerRef.current = viewer;

    // Event listeners
    eventBus.on("pagechanging", (evt: any) => {
      setCurrentPage(evt.pageNumber);
    });

    eventBus.on("scalechanging", (evt: any) => {
      const val = evt.presetValue || String(evt.scale);
      const presets = [
        "auto", "page-fit", "page-width", "page-actual",
        "0.5", "0.75", "1", "1.25", "1.5", "2", "3", "4",
      ];
      if (presets.includes(val)) {
        setScaleValue(val);
        setCustomScaleText("");
      } else {
        setScaleValue("custom");
        setCustomScaleText(`${Math.round(evt.scale * 100)}%`);
      }
    });

    eventBus.on("updatefindmatchescount", (evt: any) => {
      const { current, total } = evt.matchesCount;
      setFindResultsCount(total > 0 ? `${current} of ${total}` : "");
    });

    eventBus.on("updatefindcontrolstate", (evt: any) => {
      const { state } = evt;
      if (state === 1) setFindMessage("Not found");
      else if (state === 2) setFindMessage("Wrapped");
      else setFindMessage("");
    });

    // CLI args
    handleCliArgs();
    // Drag and drop
    setupDragDrop();
  }, []);

  // ── File Operations ──
  const openPdf = useCallback(async (filePath: string) => {
    const { readFile } = (window as any).__TAURI__.fs;
    const bytes = await readFile(filePath);
    const fileBytes = new Uint8Array(bytes);
    currentFileBytesRef.current = fileBytes;
    currentFilePathRef.current = filePath;

    const loadingTask = pdfjsLib.getDocument({
      data: fileBytes.slice(),
      cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
      cMapPacked: true,
    });
    const doc = await loadingTask.promise;

    viewerRef.current!.setDocument(doc);
    linkServiceRef.current!.setDocument(doc, null);

    setPdfDocument(doc);
    setNumPages(doc.numPages);
    setCurrentPage(1);

    const name = filePath.split("/").pop()!.split("\\").pop()!;
    document.title = `${name} — Sloppy PDF Viewer`;
  }, []);

  const openFileDialog = useCallback(async () => {
    const { open: dialogOpen } = (window as any).__TAURI__.dialog;
    const selected = await dialogOpen({
      multiple: false,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (selected) await openPdf(selected);
  }, [openPdf]);

  const saveFile = useCallback(async () => {
    if (!pdfDocumentRef.current) return;
    const { save: dialogSave } = (window as any).__TAURI__.dialog;
    const { writeFile } = (window as any).__TAURI__.fs;
    const dest = await dialogSave({
      defaultPath: currentFilePathRef.current,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!dest) return;
    let data;
    try {
      data = await pdfDocumentRef.current.saveDocument();
    } catch {
      data = await pdfDocumentRef.current.getData();
    }
    await writeFile(dest, new Uint8Array(data));
  }, []);

  // ── Navigation ──
  const nextPage = useCallback(() => viewerRef.current?.nextPage(), []);
  const previousPage = useCallback(() => viewerRef.current?.previousPage(), []);
  const goToPage = useCallback((page: number) => {
    if (viewerRef.current && pdfDocumentRef.current && page >= 1 && page <= pdfDocumentRef.current.numPages) {
      viewerRef.current.currentPageNumber = page;
    }
  }, []);
  const goToFirstPage = useCallback(() => {
    if (pdfDocumentRef.current) viewerRef.current!.currentPageNumber = 1;
  }, []);
  const goToLastPage = useCallback(() => {
    if (pdfDocumentRef.current) viewerRef.current!.currentPageNumber = pdfDocumentRef.current.numPages;
  }, []);

  // ── Zoom ──
  const zoomIn = useCallback(() => viewerRef.current?.increaseScale(), []);
  const zoomOut = useCallback(() => viewerRef.current?.decreaseScale(), []);
  const setScale = useCallback((value: string) => {
    if (viewerRef.current) viewerRef.current.currentScaleValue = value;
  }, []);

  // ── Rotation ──
  const rotateCw = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current.pagesRotation = (viewerRef.current.pagesRotation + 90) % 360;
    }
  }, []);
  const rotateCcw = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current.pagesRotation = (viewerRef.current.pagesRotation + 270) % 360;
    }
  }, []);

  // ── Find ──
  const toggleFindbar = useCallback((show?: boolean) => {
    setFindbarOpen((prev) => {
      const next = show ?? !prev;
      if (!next) {
        eventBusRef.current?.dispatch("findbarclose", { source: window });
        setFindResultsCount("");
        setFindMessage("");
      }
      return next;
    });
  }, []);

  const dispatchFind = useCallback((type = "", findPrevious = false) => {
    eventBusRef.current?.dispatch("find", {
      source: window,
      type,
      query: findQueryRef.current,
      caseSensitive: findOptionsRef.current.caseSensitive,
      entireWord: findOptionsRef.current.entireWord,
      highlightAll: findOptionsRef.current.highlightAll,
      matchDiacritics: findOptionsRef.current.matchDiacritics,
      findPrevious,
    });
  }, []);

  // ── Sidebar ──
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
    setTimeout(() => viewerRef.current?.update(), 0);
  }, []);

  const setSidebarTabFn = useCallback((tab: "thumbnails" | "outline") => {
    setSidebarTab(tab);
  }, []);

  // ── Secondary Toolbar ──
  const toggleSecondaryToolbar = useCallback(() => {
    setSecondaryToolbarOpen((prev) => !prev);
  }, []);

  const closeSecondaryToolbar = useCallback(() => {
    setSecondaryToolbarOpen(false);
  }, []);

  // ── Tools ──
  const setHandTool = useCallback((active: boolean) => {
    setHandToolActive(active);
  }, []);

  const setScrollMode = useCallback((mode: number) => {
    if (viewerRef.current) viewerRef.current.scrollMode = mode;
    setScrollModeState(mode);
  }, []);

  const setSpreadMode = useCallback((mode: number) => {
    if (viewerRef.current) viewerRef.current.spreadMode = mode;
    setSpreadModeState(mode);
  }, []);

  // ── Properties ──
  const openProperties = useCallback(() => setPropertiesOpen(true), []);
  const closeProperties = useCallback(() => setPropertiesOpen(false), []);

  // ── Drag and Drop ──
  const setupDragDrop = useCallback(async () => {
    try {
      const webview = (window as any).__TAURI__.webview.getCurrentWebview();
      await webview.onDragDropEvent(async (event: any) => {
        const { type } = event.payload;
        if (type === "enter" || type === "over") {
          document.body.classList.add("drag-hover");
        } else if (type === "leave") {
          document.body.classList.remove("drag-hover");
        } else if (type === "drop") {
          document.body.classList.remove("drag-hover");
          const pdfFile = event.payload.paths.find((f: string) =>
            f.toLowerCase().endsWith(".pdf")
          );
          if (pdfFile) await openPdf(pdfFile);
        }
      });
    } catch {
      // ignore if webview API unavailable
    }
  }, [openPdf]);

  // ── CLI args ──
  const handleCliArgs = useCallback(async () => {
    try {
      const args = await (window as any).__TAURI__.core.invoke("plugin:cli|cli_matches");
      if (args?.args?.source?.value) {
        await openPdf(args.args.source.value);
      }
    } catch {
      // ignore
    }
  }, [openPdf]);

  const value: PdfContextValue = {
    pdfDocument,
    currentPage,
    numPages,
    scaleValue,
    customScaleText,
    findResultsCount,
    findMessage,
    findbarOpen,
    sidebarOpen,
    sidebarTab,
    secondaryToolbarOpen,
    propertiesOpen,
    handToolActive,
    scrollMode,
    spreadMode,
    viewerContainerRef,
    viewerRef,
    eventBusRef,
    linkServiceRef,
    findControllerRef,
    openPdf,
    openFileDialog,
    saveFile,
    currentFilePath: currentFilePathRef.current,
    currentFileBytes: currentFileBytesRef.current,
    nextPage,
    previousPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    zoomIn,
    zoomOut,
    setScale,
    rotateCw,
    rotateCcw,
    toggleFindbar,
    dispatchFind,
    findOptionsRef,
    findQueryRef,
    toggleSidebar,
    setSidebarTab: setSidebarTabFn,
    toggleSecondaryToolbar,
    closeSecondaryToolbar,
    setHandTool,
    setScrollMode,
    setSpreadMode,
    openProperties,
    closeProperties,
    initializeViewer,
  };

  return <PdfContext.Provider value={value}>{children}</PdfContext.Provider>;
}
