import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PdfAllPages } from "./PdfCanvas";

interface FilePreviewDialogProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME = "application/pdf";
const TEXT_MIME = "text/plain";

export default function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    if (!open || !file || file.type !== DOCX_MIME || !docxContainerRef.current) return;
    setDocxError(null);
    const container = docxContainerRef.current;
    container.innerHTML = "";
    import("docx-preview")
      .then(({ renderAsync }) => renderAsync(file, container))
      .catch(() => setDocxError("Couldn't render a preview for this DOCX file."));
  }, [open, file]);

  useEffect(() => {
    if (!open || !file || file.type !== TEXT_MIME) return;
    file.text().then(setTextContent);
  }, [open, file]);

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-4">
        <DialogTitle className="truncate pr-8">{file.name}</DialogTitle>

        {file.type.startsWith("image/") && objectUrl && (
          <img src={objectUrl} alt={file.name} className="max-h-[70vh] w-full rounded-lg object-contain" />
        )}

        {file.type === PDF_MIME && (
          <div className="overflow-auto rounded-lg border border-border bg-white p-4" style={{ maxHeight: "70vh" }}>
            <PdfAllPages file={file} scale={2} />
          </div>
        )}

        {file.type === TEXT_MIME && (
          <pre className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-card p-4 text-sm whitespace-pre-wrap text-foreground">
            {textContent ?? "Loading…"}
          </pre>
        )}

        {file.type === DOCX_MIME && (
          <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-white p-4">
            {docxError ? <p className="text-sm text-destructive">{docxError}</p> : <div ref={docxContainerRef} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
