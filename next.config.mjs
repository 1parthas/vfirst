/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vfirst-api.chatloom.in"
      },
      {
        protocol: "https",
        hostname: "vfirstindia.com"
      }
    ]
  }
};

export default nextConfig;
