"""
文档加载工具类 - V2 (Serverless Edition)
Adapted to work with bytes/streams instead of file paths.
"""

import io
from docx import Document


class DocumentLoader:
    """Load a docx document from bytes or a file-like stream."""

    def __init__(self, data: bytes | io.BytesIO | None = None):
        """
        Args:
            data: raw docx bytes **or** an open ``io.BytesIO`` stream.
                  If *None* the loader starts empty; call ``load()`` later.
        """
        self._raw: bytes | io.BytesIO | None = data
        self.doc: Document | None = None
        self.doc_info: dict = {}

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------
    def load(self, data: bytes | io.BytesIO | None = None) -> bool:
        """Load a docx document from *data* (bytes or BytesIO).

        If *data* is ``None`` the value provided at construction time is
        used.

        Returns:
            ``True`` on success, ``False`` on failure.
        """
        source = data if data is not None else self._raw
        if source is None:
            self.doc_info["error"] = "没有提供文档数据"
            return False

        try:
            if isinstance(source, (bytes, bytearray)):
                stream = io.BytesIO(source)
            elif isinstance(source, io.BytesIO):
                stream = source
            else:
                raise TypeError(f"不支持的数据类型: {type(source)}")

            self.doc = Document(stream)
            self._extract_document_info(len(source) if isinstance(source, (bytes, bytearray)) else None)
            return True
        except Exception as exc:
            self.doc_info["error"] = str(exc)
            return False

    # ------------------------------------------------------------------
    # Info helpers
    # ------------------------------------------------------------------
    def _extract_document_info(self, byte_size: int | None = None):
        if not self.doc:
            return
        info = {
            "paragraph_count": len(self.doc.paragraphs),
            "section_count": len(self.doc.sections),
        }
        if byte_size is not None:
            info["file_size_kb"] = f"{byte_size / 1024:.2f} KB"
        self.doc_info = info

    def get_document_info(self) -> dict:
        """Return a dict with basic document metadata."""
        return self.doc_info

    def get_doc_object(self) -> Document | None:
        """Return the underlying ``docx.Document`` object."""
        return self.doc
