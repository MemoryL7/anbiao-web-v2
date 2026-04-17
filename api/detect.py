"""
POST /api/detect - 检测单个 .docx 文件
Vercel Python Serverless Function
"""
import sys
import os
import json
import tempfile
import io

# Add detector module to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from http.server import BaseHTTPRequestHandler
from detector.detector import DarkBidWordDetector
from detector.config import get_config, get_all_regions


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Parse multipart form data
            content_length = int(self.headers.get('Content-Length', 0))
            content_type = self.headers.get('Content-Type', '')

            if 'multipart/form-data' not in content_type:
                self._send_error(400, 'Expected multipart/form-data')
                return

            # Read body
            body = self.rfile.read(content_length)

            # Extract boundary
            boundary = content_type.split('boundary=')[-1].strip()
            if not boundary:
                self._send_error(400, 'No boundary in Content-Type')
                return

            # Parse multipart parts
            parts = self._parse_multipart(body, boundary.encode())

            # Get file
            file_data = parts.get('file')
            if not file_data:
                self._send_error(400, 'No file uploaded')
                return

            # Get other params
            region = parts.get('region', b'luoyang').decode('utf-8', errors='ignore')
            check_images = parts.get('check_images', b'true').decode('utf-8', errors='ignore').lower() == 'true'
            custom_words_str = parts.get('custom_sensitive_words', b'').decode('utf-8', errors='ignore')
            custom_words = [w.strip() for w in custom_words_str.split(',') if w.strip()] if custom_words_str else None

            # Run detection
            detector = DarkBidWordDetector(
                doc_data=file_data,
                region=region,
                check_images=check_images,
                custom_sensitive_words=custom_words
            )

            success = detector.run_detection()

            if success:
                result = detector.get_detection_results()
                # Add fixable count
                fixable_count = 0
                for category, items in result.get('modification_suggestions', {}).items():
                    for item in items:
                        if isinstance(item, dict) and item.get('fixable', False):
                            fixable_count += 1
                result['fixable_count'] = fixable_count
                self._send_json(200, {'success': True, 'data': result})
            else:
                result = detector.get_detection_results()
                self._send_json(200, {'success': False, 'data': result, 'error': '检测失败'})

        except Exception as e:
            import traceback
            self._send_error(500, f'检测出错: {str(e)}\n{traceback.format_exc()}')

    def _parse_multipart(self, body, boundary):
        """Simple multipart parser"""
        parts = {}
        boundary_line = b'--' + boundary
        segments = body.split(boundary_line)

        for segment in segments:
            if not segment or segment == b'--\r\n' or segment == b'--':
                continue

            # Split headers from content
            if b'\r\n\r\n' in segment:
                header_section, content = segment.split(b'\r\n\r\n', 1)
            elif b'\n\n' in segment:
                header_section, content = segment.split(b'\n\n', 1)
            else:
                continue

            # Remove trailing \r\n
            content = content.rstrip(b'\r\n')

            # Parse Content-Disposition
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
                if filename:
                    # It's a file - store raw bytes
                    parts['file'] = content
                else:
                    # It's a form field
                    parts[name] = content

        return parts

    def _send_json(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _send_error(self, status, message):
        self._send_json(status, {'success': False, 'error': message})
