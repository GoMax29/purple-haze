/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Note: appDir option removed as it's deprecated in Next.js 14
  env: {
    // Variables d'environnement personnalisées
    WEATHER_API_BASE_URL: process.env.WEATHER_API_BASE_URL,
    SURF_API_BASE_URL: process.env.SURF_API_BASE_URL,
  },
  async rewrites() {
    return [
      {
        source: "/dashboard/:path*",
        destination: "/dashboard-configurator/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
