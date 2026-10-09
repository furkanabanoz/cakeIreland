import { Container } from "@/components/container";

const reviews = [
  {
    name: "Sarah",
    text: "The cake looked beautiful and tasted even better. Everyone loved it!",
  },
  {
    name: "Emma",
    text: "Ordering was simple and the cake was ready exactly when promised.",
  },
  {
    name: "Aoife",
    text: "Beautiful presentation, delicious flavour and excellent service.",
  },
];

export function Reviews() {
  return (
    <section className="bg-secondary/30 py-16">
      <Container>
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Customer love
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            What our customers say
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="rounded-2xl border bg-card p-6"
            >
              <div className="text-sm text-yellow-500">★★★★★</div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                “{review.text}”
              </p>

              <p className="mt-5 font-semibold">{review.name}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
