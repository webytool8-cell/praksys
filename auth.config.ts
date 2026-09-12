import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      issuer: "https://github.com/login/oauth",
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
} satisfies NextAuthConfig;
