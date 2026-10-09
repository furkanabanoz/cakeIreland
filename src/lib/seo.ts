export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cakeireland.ie"
);

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
