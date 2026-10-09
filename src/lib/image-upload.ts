export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export function isSupportedImageMimeType(
  mimeType: string
): mimeType is (typeof IMAGE_UPLOAD_MIME_TYPES)[number] {
  return IMAGE_UPLOAD_MIME_TYPES.includes(
    mimeType as (typeof IMAGE_UPLOAD_MIME_TYPES)[number]
  );
}
