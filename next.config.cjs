/* eslint-env node */
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "backend.skinme.store",
        port: "",
        pathname: "/api/v1/images/image/download/**",
      },
    ],
  },
};

module.exports = nextConfig;
