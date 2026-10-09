"use client";

import { useState, useTransition, type FormEvent } from "react";

import { updateProfile } from "@/actions/account";

export function AccountSettingsForm({
  name,
  phone,
  email,
}: {
  name: string;
  phone: string;
  email: string;
}) {
  const [currentName, setCurrentName] = useState(name);
  const [currentPhone, setCurrentPhone] = useState(phone);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSaved(false);

    startTransition(async () => {
      const result = await updateProfile({
        name: currentName,
        phone: currentPhone,
      });

      if (!result.success) {
        setMessage(result.error ?? "Unable to save your profile.");
        return;
      }

      setSaved(true);
      setMessage("Your profile has been updated.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="account-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="account-name"
          value={currentName}
          onChange={(event) => setCurrentName(event.target.value)}
          maxLength={100}
          autoComplete="name"
          className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="account-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="account-email"
          type="email"
          value={email}
          readOnly
          aria-describedby="account-email-help"
          className="mt-2 h-11 w-full rounded-lg border bg-secondary px-3 text-sm"
        />
        <p id="account-email-help" className="mt-2 text-xs text-muted-foreground">
          Contact support if you need to change your email address.
        </p>
      </div>

      <div>
        <label htmlFor="account-phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="account-phone"
          type="tel"
          value={currentPhone}
          onChange={(event) => setCurrentPhone(event.target.value)}
          maxLength={30}
          autoComplete="tel"
          className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
        />
      </div>

      {message && (
        <p
          aria-live="polite"
          className={`text-sm ${saved ? "text-green-700" : "text-destructive"}`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
