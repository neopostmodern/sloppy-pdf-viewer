import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Inject a mock window.__TAURI__ into the page before the app loads.
 * @param {import('@playwright/test').Page} page
 * @param {string} fixturePath - path to the PDF fixture relative to project root
 */
export async function injectTauriMock(page, fixturePath) {
  const absolutePath = resolve(fixturePath);
  const pdfBytes = readFileSync(absolutePath);
  const pdfBase64 = pdfBytes.toString('base64');
  const fakePath = `/mock/${fixturePath.split('/').pop()}`;

  await page.addInitScript(({ pdfBase64, fakePath }) => {
    // Decode base64 to Uint8Array
    const binaryStr = atob(pdfBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Mock state for assertions
    window.__tauriMock = {
      dialogOpenCalled: false,
      dialogSaveCalled: false,
      fsWriteCalls: [],
      fakePath,
    };

    window.__TAURI__ = {
      dialog: {
        open: async (options) => {
          window.__tauriMock.dialogOpenCalled = true;
          window.__tauriMock.dialogOpenOptions = options;
          return fakePath;
        },
        save: async (options) => {
          window.__tauriMock.dialogSaveCalled = true;
          window.__tauriMock.dialogSaveOptions = options;
          return '/mock/output.pdf';
        },
      },
      fs: {
        readFile: async (path) => {
          return bytes.buffer;
        },
        writeFile: async (path, data) => {
          window.__tauriMock.fsWriteCalls.push({ path, dataLength: data.byteLength });
        },
      },
      webview: {
        getCurrentWebview: () => ({
          onDragDropEvent: async (callback) => {
            // Store callback for potential test use
            window.__tauriMock.dragDropCallback = callback;
          },
        }),
      },
      core: {
        invoke: async (cmd) => {
          if (cmd === 'plugin:cli|cli_matches') {
            return { args: {} };
          }
          return {};
        },
      },
    };
  }, { pdfBase64, fakePath });
}

/**
 * Open a PDF in the viewer by clicking the open button (triggers the mock dialog).
 * Waits for the PDF to finish rendering.
 * @param {import('@playwright/test').Page} page
 */
export async function openPdfViaDialog(page) {
  await page.click('[data-testid="openFile"]');
  // Wait for pdf.js to render at least one page
  await page.waitForSelector('.pdfViewer .page[data-page-number="1"]', { timeout: 10000 });
  // Give pdf.js a moment to update the toolbar
  await page.waitForTimeout(500);
}
