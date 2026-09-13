import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      issuer: "https://github.com/login/oauth",
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email ?? `${profile.id}+${profile.login}@users.noreply.github.com`,
          image: profile.avatar_url,
          githubUsername: profile.login,
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        const subscription = await prisma.subscription.findUnique({
          where: { userId: token.sub },
        });
        (session.user as any).planId = subscription?.planId ?? "free";
        (session.user as any).subscriptionStatus = subscription?.status ?? "free";
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account?.provider === "github" && account.access_token) {
        token.githubAccessToken = account.access_token;
      }
      return token;
    },
  },
  events: {
    // Auth.js only calls the adapter's linkAccount() the first time an
    // OAuth account is linked. On every later sign-in it reuses the
    // existing Account row as-is, so the stored access_token goes stale
    // forever once GitHub invalidates it. Refresh it on every sign-in.
    async signIn({ account }) {
      if (account?.provider === "github" && account.access_token) {
        await prisma.account.updateMany({
          where: { provider: "github", providerAccountId: account.providerAccountId },
          data: {
            access_token: account.access_token,
            token_type: account.token_type,
            scope: account.scope,
          },
        });
      }
    },
  },
});
