import type { Session, User } from "better-auth";

export type Variables = {
  user: User;
  session: Session;
};

export type Bindings = {
  ASSETS: Fetcher;
  DB: D1Database;
  RESEND_API_KEY: string;
};
