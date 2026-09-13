import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Revokes this app's GitHub OAuth authorization for the signed-in user.
// GitHub remembers the app is authorized, so without this, signing out
// of Praksys and back in silently re-approves the same GitHub account
// with no page shown. Revoking the grant forces GitHub to show its
// authorize screen again on the next sign-in.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return NextResponse.json({ ok: true });
  }

  const clientId = process.env.GITHUB_CLIENT_ID!;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`https://api.github.com/applications/${clientId}/grant`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: account.access_token }),
  });

  // 204 = revoked, 404 = already revoked/invalid — both are fine, sign-out proceeds either way.
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    console.error("[github/disconnect] revoke failed", res.status, body);
  }

  return NextResponse.json({ ok: true });
}
