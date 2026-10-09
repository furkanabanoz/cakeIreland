"use client";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("cakeireland:show-cookie-preferences")
        )
      }
      className="font-semibold text-primary underline underline-offset-4"
    >
      Change cookie preferences
    </button>
  );
}
