import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { UrlService } from "../services/urlService";

const staticRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

staticRoutes.get("/s/:shortCode", async (c) => {
  try {
    const shortCode = c.req.param("shortCode");
    const urlService = new UrlService(c.env.DB);

    const url = await urlService.getUrlByShortCode(shortCode);

    if (!url) {
      return c.text("URL not found", 404);
    }
    if (!url.active) {
      return c.text("URL Inactive", 403);
    }
    if (!url.isProtected) {
      return c.redirect(url.originalUrl);
    }

    return c.redirect(`/request-access/${shortCode}`);
  } catch (err) {
    console.log("Error accessing URL:", err);
    return c.text("Internal Server Error", 500);
  }
});

export { staticRoutes };

staticRoutes.get("*", async (c) => {
  // Try to serve the static asset first
  const url = new URL(c.req.url);
  const assetResponse = await c.env.ASSETS.fetch(c.req.raw);

  // If the asset exists (not 404), return it
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  // If it's not a static asset and not an API route, serve index.html for SPA routing
  if (!url.pathname.startsWith("/api/")) {
    const indexResponse = await c.env.ASSETS.fetch(
      new Request(new URL("/", url).href)
    );
    return indexResponse;
  }

  return c.text("Not found", 404);
});
