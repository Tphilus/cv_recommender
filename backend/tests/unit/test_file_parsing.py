import io

import pytest
from docx import Document

from app.utils.file_parsing import extract_docx_text, to_image_bytes


def test_to_image_bytes_passes_through_image_unchanged():
    raw = b"fake-png-bytes"
    out_bytes, out_mime = to_image_bytes(raw, "image/png")
    assert out_bytes == raw
    assert out_mime == "image/png"


def test_to_image_bytes_rejects_unsupported_mime():
    with pytest.raises(ValueError):
        to_image_bytes(b"data", "application/zip")


def test_extract_docx_text_reads_paragraphs():
    doc = Document()
    doc.add_paragraph("Ama Owusu")
    doc.add_paragraph("Backend Engineer")
    buf = io.BytesIO()
    doc.save(buf)

    text = extract_docx_text(buf.getvalue())

    assert "Ama Owusu" in text
    assert "Backend Engineer" in text
