import { useEffect, useRef, useState } from "react";

// ─── Single page canvas ─────────────────────────────────────────────────────

interface PdfCanvasProps {
  /** A File or Blob containing the PDF bytes */
  file: File | Blob;
  /** Which page to render (1-indexed). Defaults to 1. */
  page?: number;
  /** CSS class applied to the wrapping div */
  className?: string;
  /** Pixel scale multiplier — higher = sharper but slower. Default 2 (retina). */
  scale?: number;
}

/**
 * Renders a single page of a PDF to a <canvas> using pdfjs-dist.
 * Works reliably in all browser contexts (no iframe needed).
 */
export function PdfPageCanvas({ file, page = 1, className, scale = 2 }: PdfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);

    async function render() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await file.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        const pageNum = Math.max(1, Math.min(page, pdf.numPages));
        const pdfPage = await pdf.getPage(pageNum);
        if (cancelled) return;

        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await pdfPage.render({ canvasContext: ctx, viewport } as any).promise;
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [file, page, scale]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-white text-[10px] text-gray-400 ${className ?? ""}`}>
        PDF
      </div>
    );
  }

  return (
    <div className={`relative bg-white ${className ?? ""}`}>
      <canvas ref={canvasRef} className="block w-full h-auto" />
    </div>
  );
}

// ─── All-pages viewer ────────────────────────────────────────────────────────

interface PdfAllPagesProps {
  file: File | Blob;
  className?: string;
  scale?: number;
}

/**
 * Renders ALL pages of a PDF stacked vertically.
 * Best used inside a scrollable container.
 */
export function PdfAllPages({ file, className, scale = 2 }: PdfAllPagesProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNumPages(0);
    setError(null);

    async function load() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }
        const arrayBuffer = await file.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;
        setNumPages(pdf.numPages);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    }

    load();
    return () => { cancelled = true; };
  }, [file]);

  if (error) {
    return <p className="p-4 text-sm text-red-500">Could not load PDF: {error}</p>;
  }

  if (numPages === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading PDF…
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      {Array.from({ length: numPages }, (_, i) => (
        <PdfPageCanvas key={i + 1} file={file} page={i + 1} scale={scale} className="w-full rounded shadow-sm" />
      ))}
    </div>
  );
}

// Default export kept for the thumbnail card (single page)
export default PdfPageCanvas;
