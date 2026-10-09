"use client";

import { useEffect, useRef } from "react";

import {
  hasAnalyticsConsent,
  trackAnalyticsEvent,
  type AnalyticsParameters,
} from "@/lib/analytics";

interface EventTrackerProps {
  eventName: string;
  parameters: AnalyticsParameters;
  eventKey?: string;
}

export function EventTracker({
  eventName,
  parameters,
  eventKey,
}: EventTrackerProps) {
  const sent = useRef(false);

  useEffect(() => {
    function sendIfAllowed() {
      if (sent.current || !hasAnalyticsConsent() || !window.gtag) {
        return;
      }

      const storageKey = eventKey
        ? `analytics-event:${eventKey}`
        : null;

      if (storageKey) {
        try {
          if (window.sessionStorage.getItem(storageKey)) {
            sent.current = true;
            return;
          }
        } catch {
          // Event tracking can proceed if browser storage is unavailable.
        }
      }

      trackAnalyticsEvent(eventName, parameters);

      if (storageKey) {
        try {
          window.sessionStorage.setItem(storageKey, "sent");
        } catch {
          // The in-memory guard still prevents duplicate renders in this page.
        }
      }
      sent.current = true;
    }

    sendIfAllowed();
    window.addEventListener(
      "cakeireland:analytics-consent",
      sendIfAllowed
    );

    return () => {
      window.removeEventListener(
        "cakeireland:analytics-consent",
        sendIfAllowed
      );
    };
  }, [eventKey, eventName, parameters]);

  return null;
}
