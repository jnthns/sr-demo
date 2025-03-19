/** @type {import('next').NextConfig} */
const nextConfig = {
   output: 'export',  
   images: {
     unoptimized: true, 
   },
   basePath: "/sr-demo", 
   assetPrefix: "/sr-demo/",
 };
 
 module.exports = nextConfig;
 