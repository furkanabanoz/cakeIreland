"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

import {
  IMAGE_UPLOAD_MIME_TYPES,
  isSupportedImageMimeType,
  MAX_IMAGE_UPLOAD_BYTES,
} from "@/lib/image-upload";

interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

function isPreviewableImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function ImageUploadField({
  value,
  onChange,
  onUploadingChange,
}: ImageUploadFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function uploadImage(file: File) {
    setError("");
    setStatus("");

    if (file.size === 0 || file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setError("Choose an image file between 1 byte and 5 MB.");
      return;
    }

    if (file.type && !isSupportedImageMimeType(file.type)) {
      setError("Use a JPEG, PNG, WebP, GIF or AVIF image.");
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    try {
      const response = await fetch("/api/admin/images/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      const result = (await response.json()) as {
        url?: unknown;
        error?: unknown;
      };

      if (!response.ok) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "The image could not be uploaded."
        );
        return;
      }

      if (
        typeof result.url !== "string" ||
        !result.url.startsWith("https://")
      ) {
        setError("Storage returned an invalid image URL.");
        return;
      }

      onChange(result.url);
      setStatus("Image uploaded and ready to save with this record.");
    } catch {
      setError("Image upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <label
        htmlFor={id}
        aria-disabled={uploading}
        className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-secondary ${
          uploading
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }`}
      >
        {uploading ? "Uploading image..." : "Choose image file"}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={IMAGE_UPLOAD_MIME_TYPES.join(",")}
        disabled={uploading}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) {
            void uploadImage(file);
          }
        }}
        className="sr-only"
      />
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP, GIF or AVIF; maximum 5 MB. Uploaded images are publicly
        viewable on the configured image domain.
      </p>
      {uploading && (
        <p role="status" className="text-sm text-muted-foreground">
          Uploading securely to image storage...
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-green-700">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {isPreviewableImageUrl(value) && (
        <div className="relative h-32 w-48 overflow-hidden rounded-lg border bg-secondary/30">
          <Image
            src={value}
            alt="Selected image preview"
            fill
            unoptimized
            sizes="192px"
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}
