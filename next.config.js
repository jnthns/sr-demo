/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  ...(isProd && {
    output: 'export',
    basePath: '/sr-demo',
    assetPrefix: '/sr-demo/',
  }),
  images: { unoptimized: true },
};
