import io

from pdf2image import convert_from_bytes

IMAGE_MIME_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
PDF_MIME_TYPES = {"application/pdf"}
DOCX_MIME_TYPES = {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


def to_image_bytes(raw_bytes: bytes, mime_type: str) -> tuple[bytes, str]:
    """Normalizes a PDF or image upload into a single PNG page for multimodal LLM input.
    Only the first page of multi-page PDFs is used (sufficient for a CV's first page,
    which carries the header/contact info the extraction prompt weighs most)."""
    if mime_type in IMAGE_MIME_TYPES:
        return raw_bytes, mime_type

    if mime_type in PDF_MIME_TYPES:
        pages = convert_from_bytes(raw_bytes, first_page=1, last_page=1)
        buf = io.BytesIO()
        pages[0].save(buf, format="PNG")
        return buf.getvalue(), "image/png"

    raise ValueError(f"Unsupported mime type for image conversion: {mime_type}")


def extract_docx_text(raw_bytes: bytes) -> str:
    """Extracts raw text from a DOCX file for the text-only LLM extraction path."""
    from docx import Document  # local import: keeps python-docx optional at module load

    doc = Document(io.BytesIO(raw_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
