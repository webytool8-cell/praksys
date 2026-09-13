"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

interface ConnectedAccountsProps {
  githubUsername: string | null;
  image: string | null;
}

export function ConnectedAccounts({ githubUsername, image }: ConnectedAccountsProps) {
  const [confirming, setConfirming] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/disconnect-github", { method: "POST" });
    } catch {
      // Sign out anyway even if the revoke call fails.
    }
    signOut({ callbackUrl: "/" });
  };

  return (
    <Panel className="p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
        Connected Accounts
      </h2>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-800/80 bg-white/5 p-4">
        <div className="flex items-center gap-3 min-w-0">
          {image && <img src={image} alt="GitHub avatar" className="w-9 h-9 rounded-full shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">GitHub</p>
            <p className="text-xs text-muted truncate">
              {githubUsername ? `Connected as @${githubUsername}` : "Connected"}
            </p>
          </div>
        </div>

        {!confirming ? (
          <Button variant="secondary" onClick={() => setConfirming(true)} className="shrink-0">
            Disconnect
          </Button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              onClick={() => setConfirming(false)}
              disabled={disconnecting}
            >
              Cancel
            </Button>
            <Button onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? "Disconnecting…" : "Confirm"}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted">
        <p>PRAKSYS has read-only access to your repositories — we never push code or create commits.</p>
        <p>
          Disconnecting revokes PRAKSYS&apos;s GitHub authorization and signs you out, since GitHub is
          currently the only way to sign in. You can reconnect anytime from the sign-in page.
        </p>
      </div>
    </Panel>
  );
}
