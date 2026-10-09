import { moderateReview } from "@/actions/admin-review";
import { Container } from "@/components/container";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      product: {
        select: {
          name: true,
          slug: true,
        },
      },
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
  });

  return (
    <main className="py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight">
            Review moderation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reviews remain private until approved.
          </p>

          {reviews.length === 0 ? (
            <p className="mt-8 rounded-2xl border p-6 text-sm text-muted-foreground">
              There are no reviews waiting for moderation.
            </p>
          ) : (
            <div className="mt-8 space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border bg-card p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {review.product.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {review.user.name || review.user.email} · Order #
                        {review.order.orderNumber}
                      </p>
                    </div>
                    <p aria-label={`${review.rating} out of 5 stars`}>
                      {"★".repeat(review.rating)}
                      <span className="sr-only">
                        {review.rating} out of 5 stars
                      </span>
                    </p>
                  </div>

                  {review.title && (
                    <h2 className="mt-4 font-semibold">
                      {review.title}
                    </h2>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {review.body}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Submitted{" "}
                    {new Intl.DateTimeFormat("en-IE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(review.createdAt)}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <form action={moderateReview}>
                      <input
                        type="hidden"
                        name="reviewId"
                        value={review.id}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value="APPROVED"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={moderateReview}>
                      <input
                        type="hidden"
                        name="reviewId"
                        value={review.id}
                      />
                      <input
                        type="hidden"
                        name="status"
                        value="REJECTED"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border px-4 py-2 text-sm font-semibold"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
