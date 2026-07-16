import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getActiveStyles } from "@/lib/queries/styles";

const wordsForCount: Record<number, string> = {
  6: "Seis",
  7: "Siete",
  8: "Ocho",
  9: "Nueve",
  10: "Diez",
};

export async function StylesGrid() {
  const styles = await getActiveStyles();
  const heading = wordsForCount[styles.length] ?? `${styles.length}`;

  return (
    <section className="py-32">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <p className="eyebrow">Nuestras clases</p>
            <h2 className="font-display text-4xl md:text-6xl mt-4 leading-[0.95] text-balance">
              {heading} lenguajes,
              <br />
              <span className="italic text-bone-mute">un mismo escenario.</span>
            </h2>
          </div>
          <Link
            href="/clases"
            className="group inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors w-fit"
          >
            Ver todas las clases
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {styles.map((s) => (
            <Link
              key={s.slug}
              href={`/clases/${s.slug}`}
              aria-label={s.name}
              className="group relative overflow-hidden bg-ink-surface rounded-t-capsule rounded-b-capsule aspect-[1/1.6] border border-bone-border/30 hover:border-lumen transition-all duration-500"
            >
              {s.cover_url && (
                <Image
                  src={s.cover_url}
                  alt={s.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-[1.02] group-hover:scale-100"
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
