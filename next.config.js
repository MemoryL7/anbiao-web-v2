/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  // Cloudflare Pages 配置
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
