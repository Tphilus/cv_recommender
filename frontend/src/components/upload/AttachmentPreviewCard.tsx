import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import PdfCanvas from "./PdfCanvas";

interface AttachmentPreviewCardProps {
  file: File;
  onRemove: () => void;
  onClick: () => void;
  disabled?: boolean;
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME = "application/pdf";
const TEXT_MIME = "text/plain";

/** Simulated document-page thumbnail for DOC / TXT files */
function DocPageThumbnail({ filename }: { filename: string }) {
  // Render faint lines that mimic document text rows
  const lines = [
    { w: "60%", bold: true },   // title-ish line
    { w: "40%", bold: false },  // subtitle
    { w: "0%",  bold: false },  // spacer
    { w: "80%", bold: false },
    { w: "75%", bold: false },
    { w: "70%", bold: false },
    { w: "85%", bold: false },
    { w: "60%", bold: false },
    { w: "0%",  bold: false },  // spacer
    { w: "78%", bold: false },
    { w: "65%", bold: false },
    { w: "72%", bold: false },
  ];

  return (
    <div className="flex h-full w-full flex-col items-start justify-start bg-white p-2 pt-2.5 gap-[3px]">
      <p className="mb-1 w-full truncate text-center text-[6px] font-semibold leading-none text-gray-400">
        {filename}
      </p>
      {lines.map((l, i) =>
        l.w === "0%" ? (
          <div key={i} className="h-1" />
        ) : (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: l.w,
              height: l.bold ? "3.5px" : "2.5px",
              backgroundColor: l.bold ? "#9ca3af" : "#d1d5db",
            }}
          />
        )
      )}
    </div>
  );
}

/** Scaled-down PDF first-page preview using canvas (pdfjs-dist) */
function PdfThumbnail({ file }: { file: File }) {
  return (
    <PdfCanvas
      file={file}
      page={1}
      scale={1}
      className="h-full w-full"
    />
  );
}

export default function AttachmentPreviewCard({ file, onRemove, onClick, disabled }: AttachmentPreviewCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === PDF_MIME;
  const isDoc = file.type === DOCX_MIME || file.type === TEXT_MIME;
  const label =
    file.type === DOCX_MIME ? "DOC" :
    file.type === PDF_MIME  ? "PDF" :
    file.type === TEXT_MIME ? "TXT" : null;

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="relative h-28 w-24 flex-none overflow-hidden rounded-xl border border-border shadow-md">
      {/* Clickable preview area */}
      <button
        type="button"
        onClick={onClick}
        className="block h-full w-full cursor-pointer overflow-hidden"
        title="Click to preview"
      >
        {isImage && imageUrl && (
          <img src={imageUrl} alt={file.name} className="h-full w-full object-cover" />
        )}
        {isPdf && <PdfThumbnail file={file} />}
        {isDoc && <DocPageThumbnail filename={file.name} />}
        {!isImage && !isPdf && !isDoc && (
          <div className="flex h-full w-full items-center justify-center bg-card px-1.5 text-center text-[10px] text-muted-foreground">
            {file.name}
          </div>
        )}
      </button>

      {/* File-type badge — bottom-left, dark pill */}
      {label && (
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
          {label}
        </span>
      )}

      {/* Remove button — top-left */}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        title="Remove"
        className="absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
      >
        <LuX size={14} />
      </button>
    </div>
  );
}
