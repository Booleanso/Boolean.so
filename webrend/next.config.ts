import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'raw.githubusercontent.com',
      'user-images.githubusercontent.com',
      'placehold.co',
      'images.unsplash.com',
      'randomuser.me',
      'www.google.com',
      'google.com',
      'lh3.googleusercontent.com',
      'storage.googleapis.com',
      'firebasestorage.googleapis.com'
    ],
  },
};

export default nextConfig;
