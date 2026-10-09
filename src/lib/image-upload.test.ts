import assert from "node:assert/strict";
import test from "node:test";

import {
  IMAGE_UPLOAD_MIME_TYPES,
  isSupportedImageMimeType,
  MAX_IMAGE_UPLOAD_BYTES,
} from "./image-upload";

test("allows only the supported raster image formats", () => {
  assert.deepEqual(IMAGE_UPLOAD_MIME_TYPES, [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ]);
  assert.equal(isSupportedImageMimeType("image/png"), true);
  assert.equal(isSupportedImageMimeType("image/svg+xml"), false);
  assert.equal(isSupportedImageMimeType("text/html"), false);
});

test("caps image uploads at five megabytes", () => {
  assert.equal(MAX_IMAGE_UPLOAD_BYTES, 5 * 1024 * 1024);
});
