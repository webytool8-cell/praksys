import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserPlan, PLAN_LIMITS } from "@/lib/subscription";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ConnectedAccounts } from "@/components/account/ConnectedAccounts";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/account");

  const [planInfo, user, recentAnalyses] = await Promise.all([
    getUserPlan(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true, githubUsername: true },
    }),
    prisma.analysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, sourceType: true, createdAt: true },
    }),
  ]);

  const limit = PLAN_LIMITS[planInfo.planId] ?? 1;
  const isUnlimited = limit === Infinity;
  const usagePercent = isUnlimited ? 0 : Math.min((planInfo.analysisCountThisMonth / limit) * 100, 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      {searchParams.upgraded === "true" && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-accent">
          Upgrade successful! Your plan has been updated.
        </div>
      )}

      <Panel className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Account</h2>
        <div className="flex items-center gap-4">
          {user?.image && (
            <img src={user.image} alt="Avatar" className="w-12 h-12 rounded-full" />
          )}
          <div>
            <p className="font-semibold text-white">{user?.name ?? "Anonymous"}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Plan & Usage</h2>
        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
              planInfo.planId === "pro"
                ? "text-accent bg-accent/10"
                : planInfo.planId === "team"
                ? "text-accentViolet bg-accentViolet/10"
                : "text-muted bg-white/5"
            }`}
          >
            {PLAN_LABELS[planInfo.planId] ?? planInfo.planId}
          </span>
          {planInfo.planId === "free" && (
            <Link href="/pricing">
              <Button>Upgrade to Pro</Button>
            </Link>
          )}
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">
              Analyses this month:{" "}
              <strong className="text-white">{planInfo.analysisCountThisMonth}</strong>
            </span>
            <span className="text-muted">
              {isUnlimited ? "Unlimited" : `${limit} / month`}
            </span>
          </div>
          {!isUnlimited && (
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 100 ? "bg-red-500" : "bg-accent"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </div>
      </Panel>

      <ConnectedAccounts githubUsername={user?.githubUsername ?? null} image={user?.image ?? null} />

      <Panel className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
          Recent Analyses
        </h2>
        {recentAnalyses.length === 0 ? (
          <p className="text-sm text-muted">No analyses yet. <Link href="/upload" className="text-accent hover:underline">Upload a project</Link> to get started.</p>
        ) : (
          <ul className="space-y-2">
            {recentAnalyses.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard?analysisId=${a.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-muted capitalize">{a.sourceType}</p>
                  </div>
                  <p className="text-xs text-muted">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
