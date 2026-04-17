// API base URL - 可通过环境变量配置
// 本地开发: http://localhost:8000
// PythonAnywhere: https://yourusername.pythonanywhere.com
// Vercel: 留空（使用 /api 相对路径）
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
