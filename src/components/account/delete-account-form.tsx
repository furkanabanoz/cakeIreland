"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";

import { deleteAccount } from "@/actions/account";

export function DeleteAccountForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      confirmation !== "DELETE" ||
      !window.confirm(
        "Permanently delete your account? Order records needed for business and legal purposes will be retained without your account link."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAccount({
        password,
        confirmation,
      });

      if (!result.success) {
        setMessage(result.error ?? "Account deletion failed.");
        return;
      }

      await signOut({ redirectTo: "/" });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label
          htmlFor="delete-account-password"
          className="text-sm font-medium"
        >
          Confirm with your password
        </label>
        <input
          id="delete-account-password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="delete-account-confirmation"
          className="text-sm font-medium"
        >
          Type DELETE to confirm
        </label>
        <input
          id="delete-account-confirmation"
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || confirmation !== "DELETE"}
        className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Deleting..." : "Permanently delete account"}
      </button>
      <p aria-live="polite" className="text-sm text-destructive">
        {message}
      </p>
    </form>
  );
}
