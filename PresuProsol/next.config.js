/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vmbvmkrawjeedhhfhzdh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/fotosPerfiles/**',
      },
    ],
  },

  // Experimental: Modificar comportamiento de errores
  experimental: {
    // Esto puede ayudar en Next.js 15
    optimizeCss: false,
  },

  webpack: (config, { dev }) => {
    if (dev) {
      // Reducir verbosidad de errores en desarrollo
      config.devtool = 'eval-source-map';
    }
    return config;
  },
};

module.exports = nextConfig;
