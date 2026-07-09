/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/team.html", destination: "/team", permanent: false },
    ];
  },
};

export default nextConfig;
