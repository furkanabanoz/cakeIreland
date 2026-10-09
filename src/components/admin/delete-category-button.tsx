"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { deleteCategory } from "@/actions/category";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: DeleteCategoryButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${categoryName}"? Categories with products or coupon rules cannot be deleted.`
      )
    ) {
      return;
    }

    setPending(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("categoryId", categoryId);
      const result = await deleteCategory(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (deleteError) {
      console.error("CATEGORY DELETION ERROR:", deleteError);
      setError("Unable to delete this category. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <p role="alert" className="mt-2 max-w-52 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
