import { Container } from "@/components/container";

const features = [
  {
    icon: "🎂",
    title: "Made to order",
    description:
      "Our cakes are prepared with care for your special occasion.",
  },
  {
    icon: "✨",
    title: "Personalised",
    description:
      "Choose sizes, flavours, decorations and extras to make it yours.",
  },
  {
    icon: "🚚",
    title: "Flexible delivery",
    description:
      "Choose delivery or collection and select a suitable date and time.",
  },
  {
    icon: "❤️",
    title: "Made with care",
    description:
      "We focus on quality ingredients, beautiful presentation and great service.",
  },
];

export function WhyCakeIreland() {
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Why CakeIreland
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Made for moments worth celebrating
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-2xl">
                {feature.icon}
              </div>

              <h3 className="mt-4 font-semibold">{feature.title}</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
