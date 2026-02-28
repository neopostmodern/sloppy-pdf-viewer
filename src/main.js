import * as pdfjsLib from "./pdfjs/pdf.min.mjs";
import {
  EventBus,
  PDFViewer,
  PDFLinkService,
  PDFFindController,
  ScrollMode,
  SpreadMode,
} from "./pdfjs/pdf_viewer.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.min.mjs";

const { open: dialogOpen, save: dialogSave } = window.__TAURI__.dialog;
const { readFile, writeFile } = window.__TAURI__.fs;

// ── State ──

let pdfDocument = null;
let currentFilePath = null;
let currentFileBytes = null;
let handToolActive = false;
let isPanning = false;
let panStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };

// ── PDF Viewer setup ──

const viewerContainer = document.getElementById("viewerContainer");
const eventBus = new EventBus();
const linkService = new PDFLinkService({ eventBus });

const findController = new PDFFindController({ eventBus, linkService });

const pdfViewer = new PDFViewer({
  container: viewerContainer,
  eventBus,
  linkService,
  findController,
  textLayerMode: 2,
  annotationMode: 2,
  removePageBorders: false,
});

linkService.setViewer(pdfViewer);

// ── DOM refs ──

const pageNumberInput = document.getElementById("pageNumber");
const numPagesEl = document.getElementById("numPages");
const scaleSelect = document.getElementById("scaleSelect");
const findbar = document.getElementById("findbar");
const findInput = document.getElementById("findInput");
const findResultsCount = document.getElementById("findResultsCount");
const findMsg = document.getElementById("findMsg");
const sidebar = document.getElementById("sidebar");
const thumbnailView = document.getElementById("thumbnailView");
const outlineView = document.getElementById("outlineView");
const secondaryToolbar = document.getElementById("secondaryToolbar");
const propertiesOverlay = document.getElementById("propertiesOverlay");

// ── Load PDF ──

async function openPdf(filePath) {
  const bytes = await readFile(filePath);
  currentFileBytes = new Uint8Array(bytes);
  currentFilePath = filePath;

  const loadingTask = pdfjsLib.getDocument({
    data: currentFileBytes.slice(),
    cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
    cMapPacked: true,
  });
  pdfDocument = await loadingTask.promise;

  pdfViewer.setDocument(pdfDocument);
  linkService.setDocument(pdfDocument, null);

  numPagesEl.textContent = pdfDocument.numPages;
  pageNumberInput.max = pdfDocument.numPages;

  const name = filePath.split("/").pop().split("\\").pop();
  document.title = `${name} — PDF Viewer`;

  buildThumbnails();
  buildOutline();
}

async function openFileDialog() {
  const selected = await dialogOpen({
    multiple: false,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (selected) await openPdf(selected);
}

async function saveFile() {
  if (!pdfDocument) return;
  const dest = await dialogSave({
    defaultPath: currentFilePath,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (!dest) return;
  let data;
  try {
    data = await pdfDocument.saveDocument();
  } catch {
    data = await pdfDocument.getData();
  }
  await writeFile(dest, new Uint8Array(data));
}

// ── Event listeners from PDFViewer ──

eventBus.on("pagechanging", (evt) => {
  pageNumberInput.value = evt.pageNumber;
  updateActiveThumbnail(evt.pageNumber);
});

eventBus.on("scalechanging", (evt) => {
  const val = evt.presetValue || String(evt.scale);
  const opt = scaleSelect.querySelector(`option[value="${val}"]`);
  if (opt) {
    scaleSelect.value = val;
  } else {
    // Custom zoom — show percentage in the custom option
    const custom = scaleSelect.querySelector('option[value="custom"]');
    custom.textContent = `${Math.round(evt.scale * 100)}%`;
    scaleSelect.value = "custom";
  }
});

eventBus.on("updatefindmatchescount", (evt) => {
  const { current, total } = evt.matchesCount;
  findResultsCount.textContent = total > 0 ? `${current} of ${total}` : "";
});

eventBus.on("updatefindcontrolstate", (evt) => {
  const { state } = evt;
  // state: 0=FOUND, 1=NOT_FOUND, 2=WRAPPED, 3=PENDING
  if (state === 1) {
    findMsg.textContent = "Not found";
  } else if (state === 2) {
    findMsg.textContent = "Wrapped";
  } else {
    findMsg.textContent = "";
  }
});

// ── Toolbar: Page navigation ──

document.getElementById("previous").addEventListener("click", () => {
  pdfViewer.previousPage();
});

document.getElementById("next").addEventListener("click", () => {
  pdfViewer.nextPage();
});

pageNumberInput.addEventListener("change", () => {
  const num = parseInt(pageNumberInput.value, 10);
  if (num >= 1 && pdfDocument && num <= pdfDocument.numPages) {
    pdfViewer.currentPageNumber = num;
  }
});

pageNumberInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    pageNumberInput.dispatchEvent(new Event("change"));
    pageNumberInput.blur();
  }
});

// ── Toolbar: Zoom ──

document.getElementById("zoomOut").addEventListener("click", () => {
  pdfViewer.decreaseScale();
});

document.getElementById("zoomIn").addEventListener("click", () => {
  pdfViewer.increaseScale();
});

scaleSelect.addEventListener("change", () => {
  const val = scaleSelect.value;
  if (["auto", "page-fit", "page-width", "page-actual"].includes(val)) {
    pdfViewer.currentScaleValue = val;
  } else {
    pdfViewer.currentScaleValue = val;
  }
});

// ── Toolbar: Actions ──

document.getElementById("openFile").addEventListener("click", openFileDialog);
document.getElementById("download").addEventListener("click", saveFile);

document.getElementById("presentationMode").addEventListener("click", () => {
  document.documentElement.requestFullscreen?.();
});

// ── Find bar ──

function toggleFindbar(show) {
  const visible = show ?? findbar.classList.contains("hidden");
  findbar.classList.toggle("hidden", !visible);
  if (visible) {
    findInput.focus();
    findInput.select();
  } else {
    eventBus.dispatch("findbarclose", { source: window });
    findResultsCount.textContent = "";
    findMsg.textContent = "";
  }
}

function dispatchFind(type = "") {
  eventBus.dispatch("find", {
    source: window,
    type,
    query: findInput.value,
    caseSensitive: document.getElementById("findMatchCase").checked,
    entireWord: document.getElementById("findEntireWord").checked,
    highlightAll: document.getElementById("findHighlightAll").checked,
    matchDiacritics: document.getElementById("findMatchDiacritics").checked,
    findPrevious: type === "findagain" ? false : undefined,
  });
}

document.getElementById("viewFind").addEventListener("click", () => toggleFindbar());
document.getElementById("findClose").addEventListener("click", () => toggleFindbar(false));

findInput.addEventListener("input", () => dispatchFind());

findInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (e.shiftKey) {
      eventBus.dispatch("find", {
        source: window,
        type: "findagain",
        query: findInput.value,
        caseSensitive: document.getElementById("findMatchCase").checked,
        entireWord: document.getElementById("findEntireWord").checked,
        highlightAll: document.getElementById("findHighlightAll").checked,
        matchDiacritics: document.getElementById("findMatchDiacritics").checked,
        findPrevious: true,
      });
    } else {
      dispatchFind("findagain");
    }
  } else if (e.key === "Escape") {
    toggleFindbar(false);
  }
});

document.getElementById("findNext").addEventListener("click", () => dispatchFind("findagain"));
document.getElementById("findPrevious").addEventListener("click", () => {
  eventBus.dispatch("find", {
    source: window,
    type: "findagain",
    query: findInput.value,
    caseSensitive: document.getElementById("findMatchCase").checked,
    entireWord: document.getElementById("findEntireWord").checked,
    highlightAll: document.getElementById("findHighlightAll").checked,
    matchDiacritics: document.getElementById("findMatchDiacritics").checked,
    findPrevious: true,
  });
});

// Re-dispatch on option change
for (const id of ["findHighlightAll", "findMatchCase", "findEntireWord", "findMatchDiacritics"]) {
  document.getElementById(id).addEventListener("change", () => {
    if (findInput.value) dispatchFind("findagain");
  });
}

// ── Sidebar ──

function toggleSidebar() {
  sidebar.classList.toggle("hidden");
  // resize viewer after sidebar toggle
  setTimeout(() => pdfViewer.update(), 0);
}

document.getElementById("sidebarToggle").addEventListener("click", toggleSidebar);

document.getElementById("tabThumbnails").addEventListener("click", () => {
  document.getElementById("tabThumbnails").classList.add("active");
  document.getElementById("tabOutline").classList.remove("active");
  thumbnailView.classList.remove("hidden");
  outlineView.classList.add("hidden");
});

document.getElementById("tabOutline").addEventListener("click", () => {
  document.getElementById("tabOutline").classList.add("active");
  document.getElementById("tabThumbnails").classList.remove("active");
  outlineView.classList.remove("hidden");
  thumbnailView.classList.add("hidden");
});

// ── Thumbnails ──

async function buildThumbnails() {
  thumbnailView.innerHTML = "";
  if (!pdfDocument) return;

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const thumbWidth = 150;
    const scale = thumbWidth / vp.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;

    const item = document.createElement("div");
    item.className = "thumbnail-item" + (i === 1 ? " active" : "");
    item.dataset.page = i;
    item.appendChild(canvas);

    const label = document.createElement("div");
    label.className = "thumbnail-label";
    label.textContent = i;
    item.appendChild(label);

    item.addEventListener("click", () => {
      pdfViewer.currentPageNumber = i;
    });

    thumbnailView.appendChild(item);
  }
}

function updateActiveThumbnail(pageNum) {
  const prev = thumbnailView.querySelector(".thumbnail-item.active");
  if (prev) prev.classList.remove("active");
  const next = thumbnailView.querySelector(`.thumbnail-item[data-page="${pageNum}"]`);
  if (next) {
    next.classList.add("active");
    next.scrollIntoView({ block: "nearest" });
  }
}

// ── Outline ──

async function buildOutline() {
  outlineView.innerHTML = "";
  if (!pdfDocument) return;

  const outline = await pdfDocument.getOutline();
  if (!outline || outline.length === 0) {
    outlineView.innerHTML = '<div class="outline-empty">No outline available</div>';
    return;
  }

  function renderItems(items, depth) {
    for (const item of items) {
      const btn = document.createElement("button");
      btn.className = "outline-item";
      btn.style.paddingLeft = `${8 + depth * 16}px`;
      btn.textContent = item.title;
      btn.addEventListener("click", () => {
        if (item.dest) {
          linkService.goToDestination(item.dest);
        }
      });
      outlineView.appendChild(btn);

      if (item.items && item.items.length > 0) {
        renderItems(item.items, depth + 1);
      }
    }
  }

  renderItems(outline, 0);
}

// ── Secondary toolbar ──

function closeSecondaryToolbar() {
  secondaryToolbar.classList.add("hidden");
}

document.getElementById("secondaryToolbarToggle").addEventListener("click", (e) => {
  e.stopPropagation();
  secondaryToolbar.classList.toggle("hidden");
});

// Close menu on outside click
document.addEventListener("click", (e) => {
  if (!secondaryToolbar.classList.contains("hidden") &&
      !secondaryToolbar.contains(e.target)) {
    closeSecondaryToolbar();
  }
});

// First / Last page
document.getElementById("firstPage").addEventListener("click", () => {
  if (pdfDocument) pdfViewer.currentPageNumber = 1;
  closeSecondaryToolbar();
});

document.getElementById("lastPage").addEventListener("click", () => {
  if (pdfDocument) pdfViewer.currentPageNumber = pdfDocument.numPages;
  closeSecondaryToolbar();
});

// Rotate
document.getElementById("pageRotateCw").addEventListener("click", () => {
  pdfViewer.pagesRotation = (pdfViewer.pagesRotation + 90) % 360;
  closeSecondaryToolbar();
});

document.getElementById("pageRotateCcw").addEventListener("click", () => {
  pdfViewer.pagesRotation = (pdfViewer.pagesRotation + 270) % 360;
  closeSecondaryToolbar();
});

// Cursor tools
function setToggle(group, activeId) {
  for (const id of group) {
    document.getElementById(id).classList.toggle("toggled", id === activeId);
  }
}

document.getElementById("cursorSelectTool").addEventListener("click", () => {
  handToolActive = false;
  viewerContainer.classList.remove("hand-tool");
  setToggle(["cursorSelectTool", "cursorHandTool"], "cursorSelectTool");
  closeSecondaryToolbar();
});

document.getElementById("cursorHandTool").addEventListener("click", () => {
  handToolActive = true;
  viewerContainer.classList.add("hand-tool");
  setToggle(["cursorSelectTool", "cursorHandTool"], "cursorHandTool");
  closeSecondaryToolbar();
});

// Hand tool panning
viewerContainer.addEventListener("mousedown", (e) => {
  if (!handToolActive || e.button !== 0) return;
  isPanning = true;
  panStart.x = e.clientX;
  panStart.y = e.clientY;
  panStart.scrollLeft = viewerContainer.scrollLeft;
  panStart.scrollTop = viewerContainer.scrollTop;
});

document.addEventListener("mousemove", (e) => {
  if (!isPanning) return;
  viewerContainer.scrollLeft = panStart.scrollLeft - (e.clientX - panStart.x);
  viewerContainer.scrollTop = panStart.scrollTop - (e.clientY - panStart.y);
});

document.addEventListener("mouseup", () => {
  isPanning = false;
});

// Scroll modes
const scrollModeIds = ["scrollVertical", "scrollHorizontal", "scrollWrapped"];
const scrollModeMap = {
  scrollVertical: ScrollMode.VERTICAL,
  scrollHorizontal: ScrollMode.HORIZONTAL,
  scrollWrapped: ScrollMode.WRAPPED,
};

for (const id of scrollModeIds) {
  document.getElementById(id).addEventListener("click", () => {
    pdfViewer.scrollMode = scrollModeMap[id];
    setToggle(scrollModeIds, id);
    closeSecondaryToolbar();
  });
}

// Spread modes
const spreadModeIds = ["spreadNone", "spreadOdd", "spreadEven"];
const spreadModeMap = {
  spreadNone: SpreadMode.NONE,
  spreadOdd: SpreadMode.ODD,
  spreadEven: SpreadMode.EVEN,
};

for (const id of spreadModeIds) {
  document.getElementById(id).addEventListener("click", () => {
    pdfViewer.spreadMode = spreadModeMap[id];
    setToggle(spreadModeIds, id);
    closeSecondaryToolbar();
  });
}

// Document properties
document.getElementById("documentProperties").addEventListener("click", async () => {
  closeSecondaryToolbar();
  if (!pdfDocument) return;

  const { info } = await pdfDocument.getMetadata();
  const name = currentFilePath ? currentFilePath.split("/").pop().split("\\").pop() : "-";

  document.getElementById("propFileName").textContent = name;
  document.getElementById("propFileSize").textContent = currentFileBytes
    ? formatFileSize(currentFileBytes.byteLength)
    : "-";
  document.getElementById("propTitle").textContent = info.Title || "-";
  document.getElementById("propAuthor").textContent = info.Author || "-";
  document.getElementById("propSubject").textContent = info.Subject || "-";
  document.getElementById("propKeywords").textContent = info.Keywords || "-";
  document.getElementById("propCreationDate").textContent = formatPdfDate(info.CreationDate) || "-";
  document.getElementById("propModDate").textContent = formatPdfDate(info.ModDate) || "-";
  document.getElementById("propCreator").textContent = info.Creator || "-";
  document.getElementById("propProducer").textContent = info.Producer || "-";
  document.getElementById("propVersion").textContent = info.PDFFormatVersion || "-";
  document.getElementById("propPageCount").textContent = pdfDocument.numPages;
  document.getElementById("propLinearized").textContent = info.IsLinearized ? "Yes" : "No";

  // Page size from first page
  const page = await pdfDocument.getPage(1);
  const vp = page.getViewport({ scale: 1 });
  const w = (vp.width / 72).toFixed(2);
  const h = (vp.height / 72).toFixed(2);
  const wmm = (vp.width * 25.4 / 72).toFixed(1);
  const hmm = (vp.height * 25.4 / 72).toFixed(1);
  document.getElementById("propPageSize").textContent = `${w} × ${h} in (${wmm} × ${hmm} mm)`;

  propertiesOverlay.classList.remove("hidden");
});

document.getElementById("propertiesClose").addEventListener("click", () => {
  propertiesOverlay.classList.add("hidden");
});

propertiesOverlay.addEventListener("click", (e) => {
  if (e.target === propertiesOverlay) {
    propertiesOverlay.classList.add("hidden");
  }
});

// ── Keyboard shortcuts ──

document.addEventListener("keydown", (e) => {
  const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";

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
        pdfViewer.increaseScale();
        return;
      case "-":
        e.preventDefault();
        pdfViewer.decreaseScale();
        return;
      case "0":
        e.preventDefault();
        pdfViewer.currentScaleValue = "auto";
        return;
    }
  }

  if (e.key === "Escape") {
    if (!findbar.classList.contains("hidden")) {
      toggleFindbar(false);
      return;
    }
    if (!propertiesOverlay.classList.contains("hidden")) {
      propertiesOverlay.classList.add("hidden");
      return;
    }
    if (!secondaryToolbar.classList.contains("hidden")) {
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
      if (pdfDocument) pdfViewer.currentPageNumber = 1;
      break;
    case "End":
      if (pdfDocument) pdfViewer.currentPageNumber = pdfDocument.numPages;
      break;
    case "r":
      if (pdfDocument) {
        pdfViewer.pagesRotation = (pdfViewer.pagesRotation + 90) % 360;
      }
      break;
    case "R":
      if (pdfDocument) {
        pdfViewer.pagesRotation = (pdfViewer.pagesRotation + 270) % 360;
      }
      break;
    case "j":
    case "n":
      pdfViewer.nextPage();
      break;
    case "k":
    case "p":
      pdfViewer.previousPage();
      break;
  }
});

// ── Ctrl+wheel zoom ──

viewerContainer.addEventListener("wheel", (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    if (e.deltaY < 0) pdfViewer.increaseScale();
    else pdfViewer.decreaseScale();
  }
}, { passive: false });

// ── Drag and drop ──

async function setupDragDrop() {
  try {
    const webview = window.__TAURI__.webview.getCurrentWebview();
    await webview.onDragDropEvent(async (event) => {
      const { type } = event.payload;
      if (type === "enter" || type === "over") {
        document.body.classList.add("drag-hover");
      } else if (type === "leave") {
        document.body.classList.remove("drag-hover");
      } else if (type === "drop") {
        document.body.classList.remove("drag-hover");
        const pdfFile = event.payload.paths.find((f) =>
          f.toLowerCase().endsWith(".pdf")
        );
        if (pdfFile) await openPdf(pdfFile);
      }
    });
  } catch {
    // ignore if webview API unavailable
  }
}

// ── CLI args ──

async function handleCliArgs() {
  try {
    const args = await window.__TAURI__.core.invoke("plugin:cli|cli_matches");
    if (args?.args?.source?.value) {
      await openPdf(args.args.source.value);
    }
  } catch {
    // ignore
  }
}

// ── Helpers ──

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPdfDate(dateStr) {
  if (!dateStr) return null;
  // PDF date format: D:YYYYMMDDHHmmSSOHH'mm'
  const m = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return dateStr;
  const [, y, mo, d, h, mi, s] = m;
  const date = new Date(y, mo - 1, d, h || 0, mi || 0, s || 0);
  return date.toLocaleString();
}

// ── Init ──

// Set initial scale
pdfViewer.currentScaleValue = "auto";

handleCliArgs();
setupDragDrop();
