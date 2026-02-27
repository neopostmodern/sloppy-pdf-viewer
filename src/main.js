import * as pdfjsLib from "./pdfjs/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.min.mjs";

const { open } = window.__TAURI__.dialog;
const { readFile } = window.__TAURI__.fs;

const canvas = document.getElementById("pdf-canvas");
const ctx = canvas.getContext("2d");
const pageInput = document.getElementById("page-input");
const pageCount = document.getElementById("page-count");
const zoomLevel = document.getElementById("zoom-level");
const filenameEl = document.getElementById("filename");
const canvasContainer = document.getElementById("canvas-container");
const dropHint = document.getElementById("drop-hint");
const viewer = document.getElementById("viewer");

let pdfDoc = null;
let currentPage = 1;
let scale = 1.5;
let rendering = false;
let pendingPage = null;

async function renderPage(num) {
  if (rendering) {
    pendingPage = num;
    return;
  }
  rendering = true;

  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale });

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({ canvasContext: ctx, viewport }).promise;

  rendering = false;
  pageInput.value = num;

  if (pendingPage !== null) {
    const next = pendingPage;
    pendingPage = null;
    renderPage(next);
  }
}

async function openPdf(filePath) {
  const bytes = await readFile(filePath);
  const data = new Uint8Array(bytes);
  pdfDoc = await pdfjsLib.getDocument({ data }).promise;

  currentPage = 1;
  pageCount.textContent = pdfDoc.numPages;
  pageInput.max = pdfDoc.numPages;

  const name = filePath.split("/").pop().split("\\").pop();
  filenameEl.textContent = name;
  document.title = `${name} — PDF Viewer`;

  dropHint.style.display = "none";
  canvasContainer.style.display = "block";

  await renderPage(1);
}

async function openFileDialog() {
  const selected = await open({
    multiple: false,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (selected) {
    await openPdf(selected);
  }
}

function goToPage(num) {
  if (!pdfDoc) return;
  const page = Math.max(1, Math.min(num, pdfDoc.numPages));
  if (page !== currentPage) {
    currentPage = page;
    renderPage(currentPage);
  }
}

function prevPage() {
  goToPage(currentPage - 1);
}

function nextPage() {
  goToPage(currentPage + 1);
}

function setZoom(newScale) {
  scale = Math.max(0.25, Math.min(5, newScale));
  zoomLevel.textContent = `${Math.round(scale * 100)}%`;
  if (pdfDoc) renderPage(currentPage);
}

function zoomIn() {
  setZoom(scale + 0.25);
}

function zoomOut() {
  setZoom(scale - 0.25);
}

async function fitToWidth() {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(currentPage);
  const viewport = page.getViewport({ scale: 1 });
  const containerWidth = viewer.clientWidth - 40; // padding
  const newScale = containerWidth / viewport.width;
  setZoom(newScale);
}

// UI event listeners
document.getElementById("open-btn").addEventListener("click", openFileDialog);
document.getElementById("prev-btn").addEventListener("click", prevPage);
document.getElementById("next-btn").addEventListener("click", nextPage);
document.getElementById("zoom-in-btn").addEventListener("click", zoomIn);
document.getElementById("zoom-out-btn").addEventListener("click", zoomOut);
document.getElementById("zoom-fit-btn").addEventListener("click", fitToWidth);

pageInput.addEventListener("change", () => {
  goToPage(parseInt(pageInput.value, 10));
});

pageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    goToPage(parseInt(pageInput.value, 10));
    pageInput.blur();
  }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.target === pageInput) return;

  if (e.ctrlKey && e.key === "o") {
    e.preventDefault();
    openFileDialog();
    return;
  }

  switch (e.key) {
    case "ArrowLeft":
      prevPage();
      break;
    case "ArrowRight":
      nextPage();
      break;
    case "+":
    case "=":
      zoomIn();
      break;
    case "-":
      zoomOut();
      break;
  }
});

// Handle scroll wheel zoom with Ctrl
viewer.addEventListener("wheel", (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  }
}, { passive: false });

// Handle file passed as CLI argument
async function handleCliArgs() {
  try {
    const args = await window.__TAURI__.core.invoke("plugin:cli|cli_matches");
    if (args?.args?.source?.value) {
      await openPdf(args.args.source.value);
    }
  } catch {
    // CLI plugin not available or no args — ignore
  }
}

// Try resolving argv directly via Tauri event
async function checkArgv() {
  try {
    // In Tauri v2, file associations pass the path as the second argv
    // We can listen for the file-drop or check process args
    const onFileDropEvent = window.__TAURI__.event;
    if (onFileDropEvent) {
      onFileDropEvent.listen("tauri://file-drop", async (event) => {
        const files = event.payload.paths || event.payload;
        if (Array.isArray(files) && files.length > 0) {
          const pdfFile = files.find((f) => f.toLowerCase().endsWith(".pdf"));
          if (pdfFile) await openPdf(pdfFile);
        }
      });
    }
  } catch {
    // ignore
  }
}

handleCliArgs();
checkArgv();

// Update zoom display on load
zoomLevel.textContent = `${Math.round(scale * 100)}%`;
