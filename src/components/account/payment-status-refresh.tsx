"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface PaymentStatusRefreshProps {
  enabled: boolean;
}

export function PaymentStatusRefresh({
  enabled,
}: PaymentStatusRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let refreshCount = 0;

    const interval = window.setInterval(() => {
      refreshCount += 1;
      router.refresh();

      if (refreshCount >= 15) {
        window.clearInterval(interval);
      }
    }, 2_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, router]);

  if (!enabled) {
    return null;
  }

  return (
    <p
      className="mt-3 text-xs text-muted-foreground"
      aria-live="polite"
    >
      Checking payment status...
    </p>
  );
}
