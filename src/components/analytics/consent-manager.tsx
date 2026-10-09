"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type Consent = "granted" | "denied" | "unset" | "loading";

function readConsent(): Consent {
  if (typeof document === "undefined") {
    return "loading";
  }

  const value = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("analytics-consent="))
    ?.split("=")[1];

  return value === "granted" || value === "denied" ? value : "unset";
}

function subscribeToConsent(callback: () => void) {
  window.addEventListener("cakeireland:consent-change", callback);

  return () => {
    window.removeEventListener("cakeireland:consent-change", callback);
  };
}

function persistConsent(consent: "granted" | "denied") {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `analytics-consent=${consent}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent("cakeireland:consent-change"));
}

export function ConsentManager() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeToConsent,
    readConsent,
    () => "loading"
  );
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    function openPreferences() {
      setShowPreferences(true);
    }

    window.addEventListener(
      "cakeireland:show-cookie-preferences",
      openPreferences
    );

    return () => {
      window.removeEventListener(
        "cakeireland:show-cookie-preferences",
        openPreferences
      );
    };
  }, []);

  useEffect(() => {
    if (consent !== "granted" || !analyticsReady || !measurementId) {
      return;
    }

    window.gtag?.("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
    });
  }, [analyticsReady, consent, pathname]);

  function chooseConsent(nextConsent: "granted" | "denied") {
    persistConsent(nextConsent);
    setAnalyticsReady(false);
    setShowPreferences(false);

    if (nextConsent === "denied") {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
      });
    }

    window.dispatchEvent(
      new CustomEvent("cakeireland:analytics-consent")
    );
  }

  return (
    <>
      {consent === "granted" && measurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
            strategy="afterInteractive"
            onReady={() => {
              window.dataLayer = window.dataLayer ?? [];
              window.gtag =
                window.gtag ??
                function gtag(...args: unknown[]) {
                  window.dataLayer?.push(args);
                };
              window.gtag("js", new Date());
              window.gtag("config", measurementId, {
                send_page_view: false,
              });
              setAnalyticsReady(true);
              window.dispatchEvent(
                new CustomEvent("cakeireland:analytics-consent")
              );
            }}
          />
        </>
      )}

      {(consent === "unset" || showPreferences) && (
        <aside
          aria-label="Cookie preferences"
          className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-xl sm:p-6"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              We use essential storage to run this shop. With your permission,
              we also use Google Analytics to understand site usage. You can
              accept or reject analytics cookies; see our{" "}
              <a className="font-semibold text-primary underline" href="/cookies">
                cookie policy
              </a>
              .
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => chooseConsent("denied")}
                className="rounded-lg border px-4 py-2 text-sm font-semibold"
              >
                Reject analytics
              </button>
              <button
                type="button"
                onClick={() => chooseConsent("granted")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Accept analytics
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
