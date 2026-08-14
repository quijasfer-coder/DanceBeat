import Image from "next/image";
import Link from "next/link";
import { getStylesWithPublicSchedule } from "@/lib/queries/styles";
import { getActiveClasses } from "@/lib/queries/schedule";

export const metadata = {
  title: "Clases",
  description:
    "Heels, HipHop · Afro, Contemporáneo, Ritmos Latinos, Mix Styles, Flow y más. Encuentra tu lenguaje.",
};

const dayNames: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

const formatTime = (t: string): string => t.slice(0, 5); // "19:30:00" → "19:30"

export default async function ClasesPage() {
  const [visibleStyles, classes] = await Promise.all([
    getStylesWithPublicSchedule(),
    getActiveClasses(),
  ]);

  // Indexar clases por style_id para mostrar horarios resumidos en cada card
  const classesByStyle = new Map<string, typeof classes>();
  for (const c of classes) {
    const arr = classesByStyle.get(c.style_id) ?? [];
    arr.push(c);
    classesByStyle.set(c.style_id, arr);
  }

  return (
    <div className="pt-32 pb-32">
      {/* Header */}
      <section className="container mb-20">
        <p className="eyebrow">Catálogo</p>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mt-4 leading-[0.95] text-balance">
          Todas <span className="italic text-bone-mute">las clases.</span>
        </h1>
        <p className="mt-6 text-lg text-bone-mute max-w-xl text-pretty">
          {visibleStyles.length} disciplinas. Niveles desde principiante
          hasta intermedio. Todas dictadas en CDMX.
        </p>
      </section>

      {/* Grid */}
      <section className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {visibleStyles.map((s) => {
            const styleClasses = classesByStyle.get(s.id) ?? [];
            return (
              <Link
                key={s.slug}
                href={`/clases/${s.slug}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-t-capsule rounded-b-capsule aspect-[1/1.6] border border-bone-border/30 group-hover:border-lumen transition-all duration-500">
                  {s.cover_url && (
                    <Image
                      src={s.cover_url}
                      alt={s.name}
                      fill
                      sizes="(min-width: 768px) 33vw, 50vw"
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-[1.02] group-hover:scale-100"
                    />
                  )}
                </div>
                <div className="mt-4 px-2">
                  <h2 className="font-display text-2xl text-bone group-hover:text-lumen transition-colors">
                    {s.name}
                  </h2>
                  {s.tagline && (
                    <p className="text-sm text-bone-mute mt-1 text-pretty">
                      {s.tagline}
                    </p>
                  )}
                  {styleClasses.length > 0 && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mt-3">
                      {styleClasses
                        .map(
                          (c) =>
                            `${dayNames[c.day_of_week]} · ${formatTime(c.starts_at_time)}`,
                        )
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
