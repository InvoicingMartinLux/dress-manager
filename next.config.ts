import type { NextConfig } from "next";

// Garment photos are private blobs streamed through /api/garments/[id]/image,
// so no remote image host needs allowing.
const nextConfig: NextConfig = {};

export default nextConfig;
