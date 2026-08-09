/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/entry3',
        destination: '/descargas',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
