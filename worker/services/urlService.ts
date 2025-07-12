import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export class UrlService {
  private db: DrizzleD1Database<typeof schema>;

  constructor(database: D1Database) {
    this.db = drizzle(database, { schema });
  }

  async createShortUrl(
    originalUrl: string,
    userId: string,
    isProtected: boolean = false,
    authorizedEmails: string[] = []
  ) {
    const shortCode = await this.generateUniqueShortCode();

    const shortUrl = await this.db
      .insert(schema.shortUrls)
      .values({ id: nanoid(), userId, shortCode, originalUrl, isProtected })
      .returning();

    if (isProtected && authorizedEmails.length > 0) {
      const emailRecords = authorizedEmails.map((email) => ({
        id: nanoid(),
        shortUrlId: shortUrl[0].id,
        email: email.toLowerCase().trim(),
      }));

      await this.db
        .insert(schema.protectedUrlAuthorizedEmails)
        .values(emailRecords);
    }

    return {
      id: shortUrl[0].id,
      shortCode: shortUrl[0].shortCode,
      originalUrl: shortUrl[0].originalUrl,
      isProtected: shortUrl[0].isProtected,
      createdAt: shortUrl[0].createdAt,
    };
  }

  async getUserUrls(userId: string) {
    const urls = await this.db.query.shortUrls.findMany({
      where: eq(schema.shortUrls.userId, userId),
      orderBy: (shortUrls, { desc }) => [desc(shortUrls.createdAt)],
      with: {
        authorizedEmails: true,
      },
    });

    return urls.map((url) => ({
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      isProtected: url.isProtected,
      createdAt: url.createdAt,
      authorizedEmails: url.authorizedEmails?.map((ae) => ae.email) || [],
    }));
  }

  async deleteUrl(id: string, userId: string) {
    const url = await this.db.query.shortUrls.findFirst({
      where: eq(schema.shortUrls.id, id),
    });

    if (!url) {
      throw new Error("URL not found");
    }

    if (url.userId !== userId) {
      throw new Error("Undauthorized");
    }

    await this.db.delete(schema.shortUrls).where(eq(schema.shortUrls.id, id));
  }

  async getUrlByShortCode(shortCode: string) {
    const url = await this.db.query.shortUrls.findFirst({
      where: eq(schema.shortUrls.shortCode, shortCode),
      with: {
        authorizedEmails: true,
      },
    });

    return url;
  }

  async isEmailAuthorized(shortUrlId: string, email: string): Promise<boolean> {
    const authorizedEmail =
      await this.db.query.protectedUrlAuthorizedEmails.findFirst({
        where: and(
          eq(schema.protectedUrlAuthorizedEmails.shortUrlId, shortUrlId),
          eq(
            schema.protectedUrlAuthorizedEmails.email,
            email.toLowerCase().trim()
          )
        ),
      });

    return !!authorizedEmail;
  }

  async createAccessVerificationToken(
    shortUrlId: string,
    email: string
  ): Promise<string> {
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.db.insert(schema.urlAccessVerification).values({
      id: nanoid(),
      shortUrlId,
      email: email.toLowerCase().trim(),
      token,
      expiresAt,
    });

    return token;
  }

  async verifyAccessToken(token: string): Promise<{
    success: boolean;
    shortUrlId?: string;
    email?: string;
    originalUrl?: string;
    error?: string;
  }> {
    const verification = await this.db.query.urlAccessVerification.findFirst({
      where: and(
        eq(schema.urlAccessVerification.token, token),
        eq(schema.urlAccessVerification.used, false)
      ),
      with: {
        shortUrl: true,
      },
    });

    if (!verification) {
      return { success: false, error: "Invalid verification token" };
    }

    if (new Date() > verification.expiresAt) {
      return { success: false, error: "Verification token has expired" };
    }

    const isAuthorized = await this.isEmailAuthorized(
      verification.shortUrlId,
      verification.email
    );

    if (!isAuthorized) {
      await this.db
        .update(schema.urlAccessVerification)
        .set({ used: true })
        .where(eq(schema.urlAccessVerification.id, verification.id));

      return {
        success: false,
        error: "Email not authorized to access this URL",
      };
    }

    await this.db
      .update(schema.urlAccessVerification)
      .set({ used: true })
      .where(eq(schema.urlAccessVerification.id, verification.id));

    return {
      success: true,
      shortUrlId: verification.shortUrlId,
      email: verification.email,
      originalUrl: verification.shortUrl.originalUrl,
    };
  }

  private async generateUniqueShortCode(): Promise<string> {
    let shortCode = nanoid(7);
    let attempts = 0;

    while (attempts < 5) {
      const existing = await this.db.query.shortUrls.findFirst({
        where: eq(schema.shortUrls.shortCode, shortCode),
      });
      if (!existing) break;
      shortCode = nanoid(7);
      attempts++;
    }

    if (attempts >= 5) {
      throw new Error("Failed to generate unique short code");
    }

    return shortCode;
  }
}
