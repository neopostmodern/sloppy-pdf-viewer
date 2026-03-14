import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { usePdf } from "../context/PdfContext";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPdfDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const m = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return dateStr;
  const [, y, mo, d, h, mi, s] = m;
  const date = new Date(
    parseInt(y),
    parseInt(mo) - 1,
    parseInt(d),
    parseInt(h || "0"),
    parseInt(mi || "0"),
    parseInt(s || "0")
  );
  return date.toLocaleString();
}

interface Properties {
  fileName: string;
  fileSize: string;
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creationDate: string;
  modDate: string;
  creator: string;
  producer: string;
  version: string;
  pageCount: string;
  pageSize: string;
  linearized: string;
}

const defaultProps: Properties = {
  fileName: "-",
  fileSize: "-",
  title: "-",
  author: "-",
  subject: "-",
  keywords: "-",
  creationDate: "-",
  modDate: "-",
  creator: "-",
  producer: "-",
  version: "-",
  pageCount: "-",
  pageSize: "-",
  linearized: "-",
};

export default function DocumentPropertiesDialog() {
  const { propertiesOpen, closeProperties, pdfDocument } = usePdf();
  const [props, setProps] = useState<Properties>(defaultProps);

  useEffect(() => {
    if (!propertiesOpen || !pdfDocument) return;

    async function loadProperties() {
      const { info } = await pdfDocument.getMetadata();

      // Get file path from the context's ref (accessed through the window title)
      const titleMatch = document.title.match(/^(.+?) — Sloppy PDF Viewer$/);
      const name = titleMatch ? titleMatch[1] : "-";

      // Get file bytes size from the loaded document
      let fileSize = "-";
      try {
        const data = await pdfDocument.getData();
        fileSize = formatFileSize(data.byteLength);
      } catch {
        // ignore
      }

      // Page size from first page
      const page = await pdfDocument.getPage(1);
      const vp = page.getViewport({ scale: 1 });
      const w = (vp.width / 72).toFixed(2);
      const h = (vp.height / 72).toFixed(2);
      const wmm = ((vp.width * 25.4) / 72).toFixed(1);
      const hmm = ((vp.height * 25.4) / 72).toFixed(1);

      setProps({
        fileName: name,
        fileSize,
        title: info.Title || "-",
        author: info.Author || "-",
        subject: info.Subject || "-",
        keywords: info.Keywords || "-",
        creationDate: formatPdfDate(info.CreationDate) || "-",
        modDate: formatPdfDate(info.ModDate) || "-",
        creator: info.Creator || "-",
        producer: info.Producer || "-",
        version: info.PDFFormatVersion || "-",
        pageCount: String(pdfDocument.numPages),
        pageSize: `${w} × ${h} in (${wmm} × ${hmm} mm)`,
        linearized: info.IsLinearized ? "Yes" : "No",
      });
    }

    loadProperties();
  }, [propertiesOpen, pdfDocument]);

  const rows: [string, keyof Properties][] = [
    ["File Name:", "fileName"],
    ["File Size:", "fileSize"],
    ["Title:", "title"],
    ["Author:", "author"],
    ["Subject:", "subject"],
    ["Keywords:", "keywords"],
    ["Creation Date:", "creationDate"],
    ["Modification Date:", "modDate"],
    ["Creator:", "creator"],
    ["PDF Producer:", "producer"],
    ["PDF Version:", "version"],
    ["Page Count:", "pageCount"],
    ["Page Size:", "pageSize"],
    ["Linearized:", "linearized"],
  ];

  return (
    <Dialog
      open={propertiesOpen}
      onClose={closeProperties}
      data-testid="propertiesOverlay"
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          id: "propertiesOverlay",
        },
        paper: {
          sx: {
            bgcolor: "#2a2a2e",
            border: "1px solid #555",
            borderRadius: 2,
            minWidth: 400,
            maxWidth: 520,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>
        Document Properties
      </DialogTitle>
      <DialogContent>
        <Table size="small" id="propertiesTable">
          <TableBody>
            {rows.map(([label, key]) => (
              <TableRow key={key}>
                <TableCell
                  sx={{
                    color: "#999",
                    whiteSpace: "nowrap",
                    width: 140,
                    fontSize: 12,
                    borderBottom: "1px solid #3a3a3e",
                    px: 1,
                    py: 0.5,
                  }}
                >
                  {label}
                </TableCell>
                <TableCell
                  data-testid={`prop${key.charAt(0).toUpperCase()}${key.slice(1)}`}
                  id={`prop${key.charAt(0).toUpperCase()}${key.slice(1)}`}
                  sx={{
                    color: "#d4d4d8",
                    wordBreak: "break-all",
                    fontSize: 12,
                    borderBottom: "1px solid #3a3a3e",
                    px: 1,
                    py: 0.5,
                  }}
                >
                  {props[key]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={closeProperties}
          data-testid="propertiesClose"
          id="propertiesClose"
          variant="contained"
          sx={{
            bgcolor: "#0078d7",
            "&:hover": { bgcolor: "#1a8ae6" },
            textTransform: "none",
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
