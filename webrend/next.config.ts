import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Skip linting during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'raw.githubusercontent.com',
      'user-images.githubusercontent.com',
      'placehold.co',
      'images.unsplash.com',
      'randomuser.me',
      'source.unsplash.com',
      'lh3.googleusercontent.com',
      'storage.googleapis.com',
      'firebasestorage.googleapis.com'
    ],
  },
};

export default nextConfig;
