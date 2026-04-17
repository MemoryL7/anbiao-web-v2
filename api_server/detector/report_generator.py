"""
报告生成工具类 - V2 (Serverless Edition)
Generates text / JSON / HTML reports from detection results.
"""

import datetime


class ReportGenerator:
    """Generate detection reports in text, JSON, or HTML format."""

    def __init__(self, detection_results: list[dict] | None = None):
        self.detection_results = detection_results or []
        self.report_data = {
            "generated_at": datetime.datetime.now().isoformat(),
            "total_errors": len(self.detection_results),
            "results": self.detection_results,
        }

    # ── Text ────────────────────────────────────────────────────────
    def generate_text_report(self) -> str:
        lines = [
            "暗标检测报告",
            "=" * 50,
            f"生成时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"检测结果总数: {self.report_data['total_errors']}",
            "=" * 50,
        ]
        if not self.detection_results:
            lines.append("✅ 未检测到任何问题")
        else:
            # Group by type
            type_counts: dict[str, int] = {}
            for r in self.detection_results:
                t = r["type"]
                type_counts[t] = type_counts.get(t, 0) + 1
            lines.append("错误类型统计:")
            for t, c in type_counts.items():
                lines.append(f"  - {t}: {c}个")
            lines.append("=" * 50)
            lines.append("详细错误信息:")
            for i, r in enumerate(self.detection_results, 1):
                lines.append(f"\n{i}. {r['message']}")

        lines += ["=" * 50, "检测报告结束"]
        return "\n".join(lines)

    # ── JSON ────────────────────────────────────────────────────────
    def generate_json_report(self) -> dict:
        return self.report_data

    # ── HTML (accepts optional report_data override) ─────────────────
    def generate_html_report(self, report_data: dict | None = None) -> str:
        """Generate a self-contained HTML report.

        If *report_data* is provided (from ``DarkBidWordDetector.generate_report``),
        it takes precedence over the raw results stored in this instance.
        """
        if report_data is None:
            total_errors = self.report_data["total_errors"]
            results = self.detection_results
            groups: dict[str, list[dict]] = {}
            for r in results:
                groups.setdefault(r["type"], []).append(r)
        else:
            total_errors = report_data.get("total_issues", 0)
            mods = report_data.get("modification_suggestions", {})
            # Flatten suggestions dict into grouped list
            groups = {}
            for cat, sugs in mods.items():
                if cat == "系统提示":
                    continue
                for s in sugs:
                    t = s.get("type", cat)
                    groups.setdefault(t, []).append(s)

        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        parts = [
            "<!DOCTYPE html>",
            "<html lang='zh-CN'>",
            "<head>",
            "<meta charset='UTF-8'>",
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>",
            "<title>暗标检测报告</title>",
            "<style>",
            "body { font-family: 'Microsoft YaHei', sans-serif; margin: 20px; background-color: #f5f5f5; }",
            ".report-container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }",
            "h1 { color: #333; text-align: center; border-bottom: 2px solid #27ae60; padding-bottom: 10px; }",
            ".report-header { margin-bottom: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 4px; }",
            ".stats { display: flex; gap: 20px; margin-bottom: 15px; }",
            ".stat-item { flex: 1; text-align: center; padding: 10px; background-color: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }",
            ".stat-label { font-size: 14px; color: #666; margin-bottom: 5px; }",
            ".stat-value { font-size: 24px; font-weight: bold; color: #27ae60; }",
            ".error-section { margin-top: 30px; }",
            "h2 { color: #2c3e50; border-left: 4px solid #27ae60; padding-left: 10px; }",
            ".error-list { list-style: none; padding: 0; }",
            ".error-item { margin-bottom: 15px; padding: 15px; background-color: #fff3f3; border-left: 4px solid #e74c3c; border-radius: 4px; }",
            ".error-type { font-weight: bold; color: #e74c3c; margin-bottom: 5px; }",
            ".error-message { color: #333; margin-bottom: 5px; }",
            ".error-detail { font-size: 14px; color: #666; }",
            ".no-error { text-align: center; padding: 30px; color: #27ae60; font-size: 18px; background-color: #e8f5e8; border-radius: 4px; }",
            "</style>",
            "</head>",
            "<body>",
            "<div class='report-container'>",
            "<h1>暗标检测报告</h1>",
            "<div class='report-header'>",
            f"<div class='stats'>"
            f"<div class='stat-item'><div class='stat-label'>生成时间</div><div class='stat-value'>{now}</div></div>"
            f"<div class='stat-item'><div class='stat-label'>总错误数</div><div class='stat-value'>{total_errors}</div></div>"
            f"</div>",
            "</div>",
        ]

        if not groups:
            parts.append("<div class='no-error'>✅ 未检测到任何问题</div>")
        else:
            for etype, errs in groups.items():
                parts.append(f"<div class='error-section'><h2>{etype} ({len(errs)})</h2>")
                parts.append("<ul class='error-list'>")
                for e in errs:
                    msg = e.get("message", e.get("description", ""))
                    parts.append(f"<li class='error-item'><div class='error-message'>{msg}</div>")
                    if "subtype" in e:
                        parts.append(f"<div class='error-detail'>类型: {e['subtype']}</div>")
                    if "paragraph" in e:
                        parts.append(f"<div class='error-detail'>位置: 第{e['paragraph']}段</div>")
                    parts.append("</li>")
                parts.append("</ul></div>")

        parts += ["</div>", "</body>", "</html>"]
        return "\n".join(parts)

    # ── Accessor ────────────────────────────────────────────────────
    def get_results(self) -> list[dict]:
        return self.detection_results
