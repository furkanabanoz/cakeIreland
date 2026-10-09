"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setMessage("");

if (password !== confirmPassword) {
  setMessage("Passwords do not match.");
  return;
}

setLoading(true);

try {
  const response = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    setMessage(data.message ?? "Something went wrong.");
    return;
  }

  setMessage("Account created successfully!");

  setName("");
  setEmail("");
  setPassword("");
  setConfirmPassword("");
} catch {
  setMessage("Something went wrong. Please try again.");
} finally {
  setLoading(false);
}


}

return (
<main className="min-h-[70vh] py-16">
<div className="mx-auto w-full max-w-md px-4">
<div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
<div className="text-center">
<p className="text-sm font-semibold uppercase tracking-wider text-primary">
CakeIreland
</p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Create your account
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Create an account to manage your orders and details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="name"
            className="text-sm font-medium"
          >
            Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Your name"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="text-sm font-medium"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium"
          >
            Confirm password
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            required
            minLength={8}
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Repeat your password"
          />
        </div>

        {message && (
          <div className="rounded-lg border bg-secondary/40 px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  </div>
</main>


);
}