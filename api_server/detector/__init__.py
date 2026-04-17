"""
暗标检测系统工具类包 - V2 (Serverless Edition)
Adapted for bytes/streams instead of file paths.
"""

from .config import get_config, get_all_regions, get_region_name
from .document_loader import DocumentLoader
from .detectors import (
    PageFormatDetector,
    FontFormatDetector,
    TitleFormatDetector,
    ContentChecker,
)
from .detector import DarkBidWordDetector
from .report_generator import ReportGenerator
from .fixer import DocxFixer

__all__ = [
    "get_config",
    "get_all_regions",
    "get_region_name",
    "DocumentLoader",
    "PageFormatDetector",
    "FontFormatDetector",
    "TitleFormatDetector",
    "ContentChecker",
    "DarkBidWordDetector",
    "ReportGenerator",
    "DocxFixer",
]
