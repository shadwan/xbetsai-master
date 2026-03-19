import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*", "/dev"],
      },
    ],
    sitemap: "https://xbets.ai/sitemap.xml",
  };
}
