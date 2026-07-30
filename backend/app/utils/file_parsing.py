import io

IMAGE_MIME_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
DOCX_MIME_TYPES = {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
PDF_MIME_TYPES = {"application/pdf"}
TEXT_MIME_TYPES = {"text/plain"}


def to_image_bytes(raw_bytes: bytes, mime_type: str) -> tuple[bytes, str]:
    """Passes image uploads through unchanged for multimodal LLM input."""
    if mime_type in IMAGE_MIME_TYPES:
        return raw_bytes, mime_type

    raise ValueError(f"Unsupported mime type for image conversion: {mime_type}")


def pdf_to_image_bytes(raw_bytes: bytes, dpi: int = 150) -> tuple[bytes, str]:
    """Renders the first page of a PDF to a PNG image using pymupdf (no poppler needed).
    Returns (png_bytes, 'image/png').  Used as a fallback for scanned / image-only PDFs."""
    import fitz  # pymupdf — local import keeps it optional

    doc = fitz.open(stream=raw_bytes, filetype="pdf")
    page = doc.load_page(0)
    # zoom = dpi / 72 (72 is PDF default DPI)
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    return pix.tobytes("png"), "image/png"


def extract_docx_text(raw_bytes: bytes) -> str:
    """Extracts raw text from a DOCX file for the text-only LLM extraction path."""
    from docx import Document  # local import: keeps python-docx optional at module load

    doc = Document(io.BytesIO(raw_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_pdf_text(raw_bytes: bytes) -> str:
    """Extracts raw text from a PDF. Returns an empty string for scanned/image-only
    PDFs (no text layer) so callers can decide on a fallback strategy."""
    from pypdf import PdfReader  # local import: keeps pypdf optional at module load

    reader = PdfReader(io.BytesIO(raw_bytes))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract_plain_text(raw_bytes: bytes) -> str:
    """Decodes a plain-text CV upload for the text-only LLM extraction path."""
    return raw_bytes.decode("utf-8", errors="ignore")

