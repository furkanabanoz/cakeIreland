import { Container } from "@/components/container";

const faqs = [
  {
    question: "How far in advance should I order?",
    answer:
      "Preparation time depends on the product. The available delivery and collection dates will be shown when you order.",
  },
  {
    question: "Can I customise my cake?",
    answer:
      "Yes. Selected cakes can be customised with different sizes, flavours, decorations and extras.",
  },
  {
    question: "Do you offer delivery?",
    answer:
      "Yes. Available delivery areas, prices, dates and time slots will be shown during checkout.",
  },
  {
    question: "Can I collect my order?",
    answer:
      "Yes. Collection will be available where offered, with a selectable collection date and time.",
  },
];

export function FAQ() {
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              FAQ
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="mt-10 divide-y rounded-2xl border">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold">
                  <div className="flex items-center justify-between gap-4">
                    <span>{faq.question}</span>
                    <span className="text-primary transition-transform group-open:rotate-45">
                      +
                    </span>
                  </div>
                </summary>

                <p className="mt-3 pr-6 text-sm leading-6 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
