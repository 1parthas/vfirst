/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.31.85"],
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
