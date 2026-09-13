import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get GitHub access token from the Account table
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "GitHub access token not found. Please sign in with GitHub." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "updated";
  const perPage = Math.min(parseInt(searchParams.get("per_page") ?? "50"), 100);

  const res = await fetch(
    `https://api.github.com/user/repos?sort=${sort}&per_page=${perPage}&type=all`,
    {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("[github/repos] GitHub API error", res.status, body);
    return NextResponse.json(
      { error: "Failed to fetch repositories", githubStatus: res.status, githubBody: body },
      { status: res.status }
    );
  }

  const repos = await res.json();

  // Return a slimmed-down list
  const simplified = (Array.isArray(repos) ? repos : []).map((r: any) => ({
    full_name: r.full_name,
    name: r.name,
    owner: r.owner?.login,
    private: r.private,
    language: r.language,
    updated_at: r.updated_at,
    description: r.description,
  }));

  return NextResponse.json({ repos: simplified });
}
