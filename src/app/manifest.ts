import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Purple Haze",
        short_name: "Purple Haze",
        description: "Weather Surf App - Bretagne",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#2d1a65",
        theme_color: "#8b34ea",
        icons: [
            {
                src: "/icons/pwa/purple-haze-app.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any maskable",
            },
            {
                src: "/icons/pwa/purple-haze-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable",
            },
            {
                src: "/icons/pwa/purple-haze-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
            }
        ],
    };
}


