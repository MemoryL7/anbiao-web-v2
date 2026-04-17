"""
POST /api/fix - 一键修复 .docx 文件
Vercel Python Serverless Function
"""
import sys
import os
import json
import io

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from http.server import BaseHTTPRequestHandler
from detector.detector import DarkBidWordDetector
from detector.fixer import DocxFixer


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            content_type = self.headers.get('Content-Type', '')

            if 'multipart/form-data' not in content_type:
                self._send_error(400, 'Expected multipart/form-data')
                return

            body = self.rfile.read(content_length)
            boundary = content_type.split('boundary=')[-1].strip()
            parts = self._parse_multipart(body, boundary.encode())

            file_data = parts.get('file')
            if not file_data:
                self._send_error(400, 'No file uploaded')
                return

            region = parts.get('region', b'luoyang').decode('utf-8', errors='ignore')
            check_images = parts.get('check_images', b'true').decode('utf-8', errors='ignore').lower() == 'true'
            custom_words_str = parts.get('custom_sensitive_words', b'').decode('utf-8', errors='ignore')
            custom_words = [w.strip() for w in custom_words_str.split(',') if w.strip()] if custom_words_str else None

            # Run detection first
            detector = DarkBidWordDetector(
                doc_data=file_data,
                region=region,
                check_images=check_images,
                custom_sensitive_words=custom_words
            )
            success = detector.run_detection()

            if not success:
                self._send_error(500, '检测失败，无法修复')
                return

            results = detector.get_detection_results()

            # Run fixer
            fixer = DocxFixer(file_data, region)
            fixed_bytes, fix_report = fixer.fix_all(results)

            # Return fixed file as base64 + fix report
            import base64
            fixed_b64 = base64.b64encode(fixed_bytes).decode('utf-8')

            self._send_json(200, {
                'success': True,
                'fixed_file': fixed_b64,
                'fix_report': fix_report
            })

        except Exception as e:
            import traceback
            self._send_error(500, f'修复出错: {str(e)}')

    def _parse_multipart(self, body, boundary):
        parts = {}
        boundary_line = b'--' + boundary
        segments = body.split(boundary_line)

        for segment in segments:
            if not segment or segment in (b'--\r\n', b'--'):
                continue

            if b'\r\n\r\n' in segment:
                header_section, content = segment.split(b'\r\n\r\n', 1)
            elif b'\n\n' in segment:
                header_section, content = segment.split(b'\n\n', 1)
            else:
                continue

            content = content.rstrip(b'\r\n')
            header_str = header_section.decode('utf-8', errors='ignore')
            name = None
            filename = None

            for line in header_str.split('\r\n'):
                if 'Content-Disposition' in line:
                    for part in line.split(';'):
                        part = part.strip()
                        if part.startswith('name='):
                            name = part.split('=', 1)[1].strip('"')
                        elif part.startswith('filename='):
                            filename = part.split('=', 1)[1].strip('"')

            if name:
                parts['file' if filename else name] = content

        return parts

    def _send_json(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _send_error(self, status, message):
        self._send_json(status, {'success': False, 'error': message})
