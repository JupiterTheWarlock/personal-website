/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 注释掉以便本地开发
  // basePath: '/personal-website', // 注释掉以便本地开发
  images: {
    unoptimized: true
  },
  trailingSlash: true,
};

module.exports = nextConfig;
