/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Solo remotePatterns (domains está deprecated)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vmbvmkrawjeedhhfhzdh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/fotosPerfiles/**',
      },
    ],
  },
};

module.exports = nextConfig;
