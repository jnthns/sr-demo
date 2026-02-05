/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  ...(isProd && {
    output: 'export',
    basePath: '/sr-demo',
    assetPrefix: '/sr-demo/',
  }),
  images: { unoptimized: true },
});
