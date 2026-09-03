"use client";

import { useState } from "react";
import { resetMemberPassword } from "@/app/admin/actions";

export function ResetPasswordControls({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function clearSecrets() {
    setPassword("");
    setConfirm("");
  }

  function close() {
    setOpen(false);
    clearSecrets();
    setError(null);
    setBusy(false);
  }

  async function submit() {
    if (password.length < 6) {
      setError("Use at least 6 characters for the new password.");
      return;
    }
    if (password.length > 72) {
      setError("Use at most 72 characters for the new password.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);
    const result = await resetMemberPassword(userId, password);
    clearSecrets();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setDone(true);
  }

  if (done) {
    return (
      <p className="font-body-sm text-secondary max-w-xs text-right" role="status">
        Password reset. They can sign in with the new password.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className="px-4 py-2 rounded-lg font-label-lg text-label-lg bg-soft-off-white border border-surface-border text-secondary"
      >
        Reset password
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 w-full max-w-xs">
      <input
        type="password"
        autoComplete="new-password"
        value={password}
        maxLength={72}
        disabled={busy}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        aria-label="New password"
        className="w-full bg-soft-off-white border border-surface-border rounded-lg px-3 py-2 font-body-sm focus:outline-none focus:border-accent-magenta disabled:opacity-60"
      />
      <input
        type="password"
        autoComplete="new-password"
        value={confirm}
        maxLength={72}
        disabled={busy}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        aria-label="Confirm new password"
        className="w-full bg-soft-off-white border border-surface-border rounded-lg px-3 py-2 font-body-sm focus:outline-none focus:border-accent-magenta disabled:opacity-60"
      />
      {error ? (
        <p className="font-body-sm text-error text-right" role="alert">
          {error}
        </p>
      ) : null}
      <div className="inline-flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={close}
          className="px-4 py-2 rounded-lg font-label-lg text-label-lg bg-soft-off-white border border-surface-border text-secondary disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="px-4 py-2 rounded-lg font-label-lg text-label-lg bg-accent-magenta text-white disabled:opacity-60"
        >
          {busy ? "Resetting..." : "Confirm reset"}
        </button>
      </div>
    </div>
  );
}
