/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
          {
            source: "/:path*",
            headers: [
              {
                key: "Cross-Origin-Opener-Policy",
                value: "same-origin-allow-popups",
              },
            ],
          },
        ];
    },
    images: {
        domains: ['lh3.googleusercontent.com'],
    },
};

export default nextConfig;