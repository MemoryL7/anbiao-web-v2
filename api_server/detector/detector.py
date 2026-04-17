"""
暗标检测系统主类 - V2 (Serverless Edition)
Simplified: no activation/licensing, works with bytes instead of file paths.
"""

import os
import re
import io
from datetime import datetime
from docx import Document

from .config import get_config, get_region_name
from .document_loader import DocumentLoader
from .detectors import (
    PageFormatDetector,
    FontFormatDetector,
    TitleFormatDetector,
    ContentChecker,
)
from .report_generator import ReportGenerator


class DarkBidWordDetector:
    """暗标检测器主类，协调所有检测工作。"""

    def __init__(
        self,
        doc_data: bytes | io.BytesIO,
        region: str = "luoyang",
        check_images: bool = True,
        custom_sensitive_words: list[str] | None = None,
        filename: str = "document.docx",
    ):
        """
        Args:
            doc_data: raw docx bytes or ``io.BytesIO`` stream.
            region: region code (default ``luoyang``).
            check_images: whether to detect images.
            custom_sensitive_words: user-supplied sensitive words.
            filename: original filename for reporting.
        """
        self.doc_data = doc_data
        self.filename = filename
        self.region = region
        self.check_images = check_images
        self.custom_sensitive_words = custom_sensitive_words

        # Config
        self.config = get_config(region)

        # Document state
        self.doc: Document | None = None
        self.total_paragraphs = 0
        self.total_pages = 0
        self.paragraphs_per_page = 30

        # Results
        self.detection_results = {
            "basic_info": {},
            "page_format": {},
            "font_format": {},
            "title_format": {},
            "content_check": {},
            "overall_result": "pass",
            "modification_suggestions": {
                "页面格式问题": [],
                "字体格式问题": [],
                "标题格式问题": [],
                "内容合规问题": [],
                "系统提示": [],
            },
        }

        # Sub-configs
        self.page_config = self.config["page_format"]
        self.font_config = self.config["font_format"]
        self.title_config = self.config["title_format"]
        self.content_config = self.config["content_check"]
        self.detection_items = self.config["detection_items"]

        if self.custom_sensitive_words:
            self.sensitive_patterns = self.custom_sensitive_words
        else:
            self.sensitive_patterns = self.content_config["sensitive_patterns"]

        self.allowed_fonts = self.font_config["allowed_fonts"]

        # Tools
        self.document_loader = DocumentLoader(doc_data)

    # ── Suggestion helper ───────────────────────────────────────────
    def _add_suggestion(self, category: str, suggestion: dict):
        cat = self.detection_results["modification_suggestions"]
        if category in cat:
            cat[category].append(suggestion)
        else:
            cat["系统提示"].append(suggestion)

    # ── Page estimation ─────────────────────────────────────────────
    def _estimate_page_count(self) -> int:
        if self.total_paragraphs == 0:
            return 0
        return max(1, (self.total_paragraphs + 29) // 30)

    def _get_page_number(self, paragraph_number: int) -> int:
        if self.paragraphs_per_page == 0 or paragraph_number == 0:
            return 1
        return (paragraph_number - 1) // self.paragraphs_per_page + 1

    # ── Document loading ────────────────────────────────────────────
    def load_document(self) -> bool:
        try:
            if not self.document_loader.load():
                error = self.document_loader.doc_info.get("error", "未知错误")
                self._add_suggestion(
                    "系统提示",
                    {
                        "type": "文件加载错误",
                        "severity": "严重",
                        "description": f"Word文件加载失败: {error}",
                        "location": "系统",
                        "current_setting": f"文件: {self.filename}",
                        "should_setting": "应能正常加载的Word文档",
                        "content_preview": "",
                        "suggestion": [
                            "1. 请检查文件是否存在且格式正确",
                            "2. 尝试重新打开或修复文件",
                            "3. 确保有足够的权限访问文件",
                        ],
                    },
                )
                return False

            self.doc = self.document_loader.get_doc_object()
            doc_info = self.document_loader.get_document_info()

            self.total_paragraphs = doc_info.get("paragraph_count", 0)
            self.total_pages = self._estimate_page_count()
            self.paragraphs_per_page = (
                max(1, self.total_paragraphs // self.total_pages) if self.total_pages > 0 else 30
            )

            self.detection_results["basic_info"] = {
                "file_name": self.filename,
                "file_format": "docx",
                "total_paragraphs": self.total_paragraphs,
                "estimated_pages": self.total_pages,
                "paragraphs_per_page": self.paragraphs_per_page,
                "file_size": doc_info.get("file_size_kb", "N/A"),
                "check_images": self.check_images,
            }
            return True

        except Exception as e:
            self._add_suggestion(
                "系统提示",
                {
                    "type": "文件加载错误",
                    "severity": "严重",
                    "description": f"Word文件加载失败: {str(e)}",
                    "location": "系统",
                    "current_setting": f"文件: {self.filename}",
                    "should_setting": "应能正常加载的Word文档",
                    "content_preview": "",
                    "suggestion": [
                        "1. 请检查文件是否存在且格式正确",
                        "2. 尝试重新打开或修复文件",
                        "3. 确保有足够的权限访问文件",
                    ],
                },
            )
            return False

    # ── Main detection ──────────────────────────────────────────────
    def run_detection(self) -> bool:
        """Run the full detection pipeline.  Returns ``True`` on success."""
        if not self.load_document():
            return False

        try:
            all_results: list[dict] = []

            if self.detection_items.get("page_format", True):
                pf = PageFormatDetector(self.doc, self.config)
                all_results.extend(pf.check_page_format())

            if self.detection_items.get("font_format", True):
                ff = FontFormatDetector(self.doc, self.config)
                all_results.extend(ff.check_font_format())

            if self.detection_items.get("title_format", True):
                tf = TitleFormatDetector(self.doc, self.config)
                all_results.extend(tf.check_title_format())

            if self.detection_items.get("content_check", True):
                cc = ContentChecker(
                    self.doc,
                    self.config,
                    check_images=self.check_images,
                    custom_sensitive_words=self.custom_sensitive_words,
                )
                all_results.extend(cc.check_content())

            self._process_detection_results(all_results)
            self._generate_overall_result()
            return True

        except Exception as e:
            self._add_suggestion(
                "系统提示",
                {
                    "type": "检测错误",
                    "severity": "严重",
                    "description": f"检测过程中发生错误: {str(e)}",
                    "location": "系统",
                    "current_setting": "检测状态: 失败",
                    "should_setting": "检测状态: 成功",
                    "content_preview": f"文件: {self.filename}",
                    "suggestion": ["1. 请检查文件是否损坏", "2. 尝试重新检测"],
                },
            )
            return False

    # ── Result processing ───────────────────────────────────────────
    def _process_detection_results(self, results: list[dict]):
        if not results:
            return
        cat_map = {
            "page_format": "页面格式问题",
            "font_format": "字体格式问题",
            "title_format": "标题格式问题",
            "content_check": "内容合规问题",
        }
        for r in results:
            cat = cat_map.get(r["type"], "系统提示")
            suggestion = {
                "type": r.get("subtype", "其他"),
                "severity": "高",
                "description": r["message"],
                "location": f'第{r.get("paragraph", "")}段' if "paragraph" in r else "",
                "current_setting": f'当前值: {r.get("actual", "")}' if "actual" in r else "",
                "should_setting": f'应设置为: {r.get("expected", "")}' if "expected" in r else "",
                "content_preview": r.get("title_text", ""),
                "suggestion": [f"请修改{r['type']}问题"],
            }
            self._add_suggestion(cat, suggestion)

    def _generate_overall_result(self):
        total = sum(
            len(v) for k, v in self.detection_results["modification_suggestions"].items() if k != "系统提示"
        )
        self.detection_results["overall_result"] = "fail" if total > 0 else "pass"

    # ── Reporting ───────────────────────────────────────────────────
    def generate_report(self, report_type: str = "text"):
        report_data = {
            "basic_info": self.detection_results["basic_info"],
            "overall_result": self.detection_results["overall_result"],
            "total_issues": sum(
                len(v)
                for k, v in self.detection_results["modification_suggestions"].items()
                if k != "系统提示"
            ),
            "modification_suggestions": self.detection_results["modification_suggestions"],
        }
        if report_type == "json":
            return report_data
        if report_type == "html":
            rg = ReportGenerator([])
            return rg.generate_html_report(report_data)
        return self._generate_text_report(report_data)

    def _generate_text_report(self, data: dict) -> str:
        lines = [
            "暗标检测报告",
            "=" * 50,
            f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"文件名称: {data['basic_info'].get('file_name', '')}",
            f"检测地区: {get_region_name(self.region)}",
            f"总体结果: {'通过' if data['overall_result'] == 'pass' else '不通过'}",
            f"问题总数: {data['total_issues']}",
            "=" * 50,
        ]
        for cat, sugs in data["modification_suggestions"].items():
            if sugs:
                lines.append(f"\n{cat} ({len(sugs)}):")
                for i, s in enumerate(sugs, 1):
                    lines.append(f"  {i}. {s['description']}")
        lines += ["=" * 50, "检测报告结束"]
        return "\n".join(lines)

    def get_detection_results(self) -> dict:
        return self.detection_results
