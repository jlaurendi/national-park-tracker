import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static app (GitHub Pages). Part 2 (server/API) removes this.
  output: "export",
  // Project pages serve from /<repo>/; the deploy workflow sets this env var.
  // Empty in local dev so localhost:3000 keeps working at the root.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  // Emit folder/index.html per route so refreshing deep links works on Pages.
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // No image optimizer under static export; park heroes are pre-sized
    // 960px Wikimedia URLs anyway.
    unoptimized: true,
  },
};

export default nextConfig;
