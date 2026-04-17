"""
GET /api/regions - 获取可用检测规则列表
Vercel Python Serverless Function
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from http.server import BaseHTTPRequestHandler
from detector.config import get_all_regions, get_config


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Get all built-in regions
            regions = get_all_regions()

            region_list = []
            for code, config in regions.items():
                region_list.append({
                    'code': code,
                    'name': config.get('name', code),
                    'description': config.get('description', ''),
                })

            self._send_json(200, {'success': True, 'data': region_list})

        except Exception as e:
            self._send_error(500, f'获取规则列表失败: {str(e)}')

    def _send_json(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _send_error(self, status, message):
        self._send_json(status, {'success': False, 'error': message})
