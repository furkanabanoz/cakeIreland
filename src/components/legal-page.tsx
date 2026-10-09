import { Container } from "@/components/container";
import type { ReactNode } from "react";

export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export function LegalPage({
  title,
  intro,
  sections,
  notice,
  children,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  notice?: string;
  children?: ReactNode;
}) {
  return (
    <main className="py-12 sm:py-16">
      <Container>
        <article className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-7 text-muted-foreground">
            {intro}
          </p>

          {notice && (
            <p className="mt-6 rounded-xl border border-amber-500/40 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              {notice}
            </p>
          )}

          {children && <div className="mt-6">{children}</div>}

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-3 leading-7 text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-muted-foreground">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </Container>
    </main>
  );
}
