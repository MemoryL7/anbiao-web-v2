"""
Built-in region configurations for dark bid (暗标) detection.
Ported from detection_config.py — no file I/O / disk dependency.
"""

# ── Constants ───────────────────────────────────────────────────────
PAGE_ORIENTATION_PORTRAIT = "纵向"
PAGE_ORIENTATION_LANDSCAPE = "横向"
SPACING_TYPE_FIXED = "固定值"

# ── Default region configs ──────────────────────────────────────────
DEFAULT_CONFIGS = {
    "luoyang": {
        "name": "洛阳市",
        "description": "洛阳市公共资源交易中心暗标要求及标暗编制指引",
        "page_format": {
            "a4_check": True,
            "orientation": PAGE_ORIENTATION_PORTRAIT,
            "margin_standard": 2.5,
            "margin_tolerance": 0.0,
            "forbid_header_footer": True,
            "forbid_page_numbers": True,
            "forbid_blank_pages": True,
            "min_reasonable_margin_cm": 0.5,
            "max_reasonable_margin_cm": 10.0,
        },
        "font_format": {
            "allowed_fonts": ["宋体"],
            "font_size": 14.0,
            "font_color": "black",
            "forbid_italic": True,
            "forbid_underline": True,
            "line_spacing": {"type": SPACING_TYPE_FIXED, "value": 28.0},
            "paragraph_spacing": {"before": 0.0, "after": 0.0},
        },
        "title_format": {
            "patterns": [
                r"^[一二三四五六七八九十]+、",
                r"^\([一二三四五六七八九十]+\)",
                r"^\d+、",
                r"^\(\d+\)",
                r"^\d+\)",
                r"^[a-z]+\.",
                r"^[a-z]+\)",
            ],
            "max_levels": 7,
        },
        "content_check": {
            "forbid_images": True,
            "forbid_electronic_signature": True,
            "sensitive_patterns": [],
        },
        "detection_items": {
            "page_format": True,
            "font_format": True,
            "title_format": True,
            "content_check": True,
        },
    },
    "custom": {
        "name": "自定义配置",
        "description": "用户自定义的检测配置",
        "page_format": {
            "a4_check": True,
            "orientation": PAGE_ORIENTATION_PORTRAIT,
            "margin_standard": 2.5,
            "margin_tolerance": 0.0,
            "forbid_header_footer": True,
            "forbid_page_numbers": True,
            "forbid_blank_pages": True,
            "min_reasonable_margin_cm": 0.5,
            "max_reasonable_margin_cm": 10.0,
        },
        "font_format": {
            "allowed_fonts": ["宋体"],
            "font_size": 14.0,
            "font_color": "black",
            "forbid_italic": True,
            "forbid_underline": True,
            "line_spacing": {"type": SPACING_TYPE_FIXED, "value": 28.0},
            "paragraph_spacing": {"before": 0.0, "after": 0.0},
        },
        "title_format": {
            "patterns": [
                r"^[一二三四五六七八九十]+、",
                r"^\([一二三四五六七八九十]+\)",
            ],
            "max_levels": 7,
        },
        "content_check": {
            "forbid_images": True,
            "forbid_electronic_signature": True,
            "sensitive_patterns": [],
        },
        "detection_items": {
            "page_format": True,
            "font_format": True,
            "title_format": True,
            "content_check": True,
        },
    },
}


# ── Public API ──────────────────────────────────────────────────────
def get_config(region: str) -> dict:
    """Return configuration dict for *region*."""
    if region not in DEFAULT_CONFIGS:
        raise ValueError(f"未找到地区 '{region}' 的检测配置")
    return DEFAULT_CONFIGS[region]


def get_all_regions() -> list[str]:
    """Return list of available region codes."""
    return list(DEFAULT_CONFIGS.keys())


def get_region_name(region: str) -> str:
    """Return human-readable name for *region*."""
    return get_config(region)["name"]


def update_config(region: str, config_updates: dict) -> bool:
    """Deep-merge *config_updates* into *region* config (in-memory)."""
    if region not in DEFAULT_CONFIGS:
        DEFAULT_CONFIGS[region] = DEFAULT_CONFIGS["custom"].copy()
    _deep_update(DEFAULT_CONFIGS[region], config_updates)
    return True


def _deep_update(original: dict, updates: dict):
    for key, value in updates.items():
        if isinstance(value, dict) and key in original and isinstance(original[key], dict):
            _deep_update(original[key], value)
        else:
            original[key] = value
