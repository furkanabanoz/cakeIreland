export type AnalyticsParameters = Record<
  string,
  string | number | boolean | object | undefined
>;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasAnalyticsConsent() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim() === "analytics-consent=granted");
}

export function trackAnalyticsEvent(
  eventName: string,
  parameters: AnalyticsParameters = {}
) {
  if (!hasAnalyticsConsent() || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, parameters);
}
