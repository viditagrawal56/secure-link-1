import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { requireAuth } from "../middleware/middleware";
import { zValidator } from "@hono/zod-validator";
import { UrlService } from "../services/urlService";
import { z } from "zod";
import { EmailService } from "../services/emailService";

const createUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  isProtected: z.boolean().optional().default(false),
  authorizedEmails: z.array(z.string().email()).optional().default([]),
});

const requestAccessSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const urlRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

urlRoutes.post(
  "/shorten",
  requireAuth,
  zValidator("json", createUrlSchema),
  async (c) => {
    try {
      const { url, isProtected, authorizedEmails } = c.req.valid("json");
      const user = c.get("user");
      const urlService = new UrlService(c.env.DB);

      if (isProtected && (!authorizedEmails || authorizedEmails.length === 0)) {
        return c.json(
          { error: "Protected URLs must have at least one authorized email" },
          400
        );
      }

      const result = await urlService.createShortUrl(
        url,
        user.id,
        isProtected,
        authorizedEmails
      );

      return c.json({
        ...result,
        shortUrl: `${new URL(c.req.url).origin}/s/${result.shortCode}`,
      });
    } catch (err) {
      console.log("Error creating short URL:", err);
      return c.json({ error: "Failed to create short URL" }, 500);
    }
  }
);

urlRoutes.get("/urls", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const urlService = new UrlService(c.env.DB);

    const urls = await urlService.getUserUrls(user.id);
    const baseUrl = new URL(c.req.url).origin;

    const formattedUrls = urls.map((url) => ({
      ...url,
      shortUrl: `${baseUrl}/s/${url.shortCode}`,
    }));

    return c.json(formattedUrls);
  } catch (err) {
    console.log("Error fetching URLs:", err);
    return c.json({ error: "Failed to fetch URLs" }, 500);
  }
});

urlRoutes.delete("/urls/:id", requireAuth, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    const urlService = new UrlService(c.env.DB);

    await urlService.deleteUrl(id, user.id);

    return c.json({ message: "URL deleted successfully" });
  } catch (err) {
    console.log("Error deleting URL:", err);

    if (err instanceof Error) {
      if (err.message === "URL not found") {
        return c.json({ error: "URL not found" }, 404);
      }
      if (err.message === "Unauthorized") {
        return c.json({ error: "Unauthorized" }, 403);
      }
    }

    return c.json({ error: "Failed to delete URL" }, 500);
  }
});

urlRoutes.post(
  "/request-access/:shortCode",
  zValidator("json", requestAccessSchema),
  async (c) => {
    try {
      const shortCode = c.req.param("shortCode");
      const { email } = c.req.valid("json");
      const urlService = new UrlService(c.env.DB);
      const emailService = new EmailService(c.env.RESEND_API_KEY); //TODO: add this in worker secrets

      const url = await urlService.getUrlByShortCode(shortCode);

      if (!url) {
        return c.json({ error: "URL not found" }, 404);
      }

      if (!url.isProtected) {
        return c.json({ error: "This URL is not protected" }, 400);
      }

      const isAuthorized = await urlService.isEmailAuthorized(url.id, email);

      if (!isAuthorized) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const token = await urlService.createAccessVerificationToken(
        url.id,
        email
      );
      const verificationUrl = `${new URL(c.req.url).origin}/api/verify-access/${token}`;

      await emailService.sendVerificationEmail(email, verificationUrl);

      return c.json({
        success: true,
        message: "Verification email sent successfully",
      });
    } catch (err) {
      console.log("Error requesting access:", err);
      return c.json({ error: "Failed to process access request" }, 500);
    }
  }
);

urlRoutes.get("/verify-access/:token", async (c) => {
  try {
    const token = c.req.param("token");
    const urlService = new UrlService(c.env.DB);

    const verification = await urlService.verifyAccessToken(token);

    if (!verification.success) {
      return c.redirect("/access-denied");
    }

    return c.redirect(verification.originalUrl!);
  } catch (err) {
    console.log("Error verifying access:", err);
    return c.json({ error: "Failed to verify access" }, 500);
  }
});

export { urlRoutes };
