/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/personal-website',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
};

module.exports = nextConfig;
