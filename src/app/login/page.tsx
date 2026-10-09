"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const params = new URLSearchParams(
        window.location.search
      );

      const callbackUrl =
        params.get("callbackUrl") || "/account";

      console.log("LOGIN ATTEMPT:", email);
      console.log("LOGIN CALLBACK:", callbackUrl);

      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      console.log("LOGIN RESULT:", result);

      if (!result || result.error) {
        console.error("LOGIN FAILED:", result);

        setMessage(
          "Invalid email or password. Please check your details."
        );

        setLoading(false);
        return;
      }

      console.log("LOGIN SUCCESS");
      console.log("REDIRECTING TO:", callbackUrl);

      /*
       * NextAuth login başarılı olduğunda session cookie
       * browser'a yazılmış olur.
       *
       * Bir sonraki navigation'ı browser üzerinden yapıyoruz.
       */
      window.location.href = callbackUrl;
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setMessage(
        "Something went wrong. Please try again."
      );

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
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage your orders and account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
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
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                autoComplete="email"
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
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your password"
              />
            </div>

            {message && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>
              Don&apos;t have an account?{" "}
            </span>

            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
