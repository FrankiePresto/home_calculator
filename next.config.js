/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/home_calculator',
  assetPrefix: '/home_calculator/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
