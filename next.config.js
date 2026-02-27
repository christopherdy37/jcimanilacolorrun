/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/**',
      },
    ],
    // Set DISABLE_IMAGE_OPTIMIZATION=true if you get EACCES on .next/cache in production
    unoptimized: process.env.DISABLE_IMAGE_OPTIMIZATION === 'true',
  },
  output: 'standalone',
}

module.exports = nextConfig

