"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { submitReview } from "@/actions/review";

interface ReviewFormProps {
  productId: string;
  orderIds: string[];
}

export function ReviewForm({
  productId,
  orderIds,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [orderId, setOrderId] = useState(orderIds[0] ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await submitReview({
        productId,
        orderId,
        rating,
        title,
        body,
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setMessage(result.message);
      setTitle("");
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {orderIds.length > 1 && (
        <div>
          <label
            htmlFor={`review-order-${productId}`}
            className="text-sm font-medium"
          >
            Verified purchase
          </label>
          <select
            id={`review-order-${productId}`}
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            {orderIds.map((id) => (
              <option key={id} value={id}>
                Order ending {id.slice(-6)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label
          htmlFor={`review-rating-${productId}`}
          className="text-sm font-medium"
        >
          Your rating
        </label>
        <select
          id={`review-rating-${productId}`}
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} out of 5 stars
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`review-title-${productId}`}
          className="text-sm font-medium"
        >
          Title (optional)
        </label>
        <input
          id={`review-title-${productId}`}
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor={`review-body-${productId}`}
          className="text-sm font-medium"
        >
          Your review
        </label>
        <textarea
          id={`review-body-${productId}`}
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-2 w-full rounded-lg border bg-background p-3 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !orderId}
        className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit review"}
      </button>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {message}
      </p>
    </form>
  );
}
