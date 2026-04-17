"""
FastAPI 后端 - 用于 PythonAnywhere 部署
替代 Vercel Python Serverless Functions
"""
import sys
import os
import io
import json
import base64
import tempfile

# Add detector module to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from detector.detector import DarkBidWordDetector
from detector.config import get_all_regions, get_config
from detector.fixer import DocxFixer

app = FastAPI(title="暗标检测系统 API")

# CORS - 允许 Cloudflare Pages 前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境改为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "暗标检测系统 API", "status": "running"}


@app.post("/api/detect")
async def detect(
    file: UploadFile = File(...),
    region: str = Form(default="luoyang"),
    check_images: str = Form(default="true"),
    custom_sensitive_words: str = Form(default=""),
):
    """检测单个 .docx 文件"""
    try:
        # Read file bytes
        file_bytes = await file.read()

        # Parse params
        check_images_bool = check_images.lower() == "true"
        custom_words = (
            [w.strip() for w in custom_sensitive_words.split(",") if w.strip()]
            if custom_sensitive_words.strip()
            else None
        )

        # Run detection
        detector = DarkBidWordDetector(
            doc_data=file_bytes,
            region=region,
            check_images=check_images_bool,
            custom_sensitive_words=custom_words,
        )

        success = detector.run_detection()

        if success:
            result = detector.get_detection_results()
            # Add fixable count
            fixable_count = 0
            for category, items in result.get("modification_suggestions", {}).items():
                for item in items:
                    if isinstance(item, dict) and item.get("fixable", False):
                        fixable_count += 1
            result["fixable_count"] = fixable_count
            return {"success": True, "data": result}
        else:
            result = detector.get_detection_results()
            return {"success": False, "data": result, "error": "检测失败"}

    except Exception as e:
        import traceback
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"检测出错: {str(e)}"},
        )


@app.post("/api/fix")
async def fix(
    file: UploadFile = File(...),
    region: str = Form(default="luoyang"),
):
    """一键修复 .docx 文件"""
    try:
        file_bytes = await file.read()

        # Run detection first
        detector = DarkBidWordDetector(
            doc_data=file_bytes,
            region=region,
        )
        success = detector.run_detection()

        if not success:
            return {"success": False, "error": "检测失败，无法修复"}

        results = detector.get_detection_results()

        # Run fixer
        fixer = DocxFixer(file_bytes, region)
        fixed_bytes, fix_report = fixer.fix_all(results)

        # Return as base64
        fixed_b64 = base64.b64encode(fixed_bytes).decode("utf-8")

        return {
            "success": True,
            "fixed_file": fixed_b64,
            "fix_report": fix_report,
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"修复出错: {str(e)}"},
        )


@app.get("/api/regions")
async def regions():
    """获取可用检测规则列表"""
    try:
        regions = get_all_regions()
        region_list = []
        for code, config in regions.items():
            region_list.append(
                {
                    "code": code,
                    "name": config.get("name", code),
                    "description": config.get("description", ""),
                }
            )
        return {"success": True, "data": region_list}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"获取规则列表失败: {str(e)}"},
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
