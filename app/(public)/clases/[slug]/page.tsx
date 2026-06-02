import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Users, ChevronRight } from "lucide-react";
import { getActiveStyles, getStyleBySlug } from "@/lib/queries/styles";
import { getClassesByStyleSlug } from "@/lib/queries/schedule";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const styles = await getActiveStyles();
  return styles.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const s = await getStyleBySlug(slug);
  if (!s) return {};
  return {
    title: s.name,
    description: s.tagline ?? undefined,
    openGraph: s.cover_url ? { images: [s.cover_url] } : undefined,
  };
}

const dayNamesLong: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const formatTime = (t: string): string => t.slice(0, 5);

const formatSessionDate = (d: Date): string =>
  new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(d)
    .replace(".", "")
    .toUpperCase();

/** Calcula próximas N ocurrencias futuras de un horario recurrente. */
function getUpcomingDates(
  schedules: Array<{ day_of_week: number; starts_at_time: string }>,
  count = 4,
  from: Date = new Date(),
): Date[] {
  if (!schedules.length) return [];
  const out: Date[] = [];
  for (const s of schedules) {
    const [h, m] = s.starts_at_time.split(":").map(Number);
    const cursor = new Date(from);
    cursor.setHours(h, m, 0, 0);
    const ahead = (s.day_of_week - cursor.getDay() + 7) % 7;
    cursor.setDate(cursor.getDate() + ahead);
    if (ahead === 0 && cursor.getTime() < from.getTime()) {
      cursor.setDate(cursor.getDate() + 7);
    }
    for (let i = 0; i < count; i++) {
      out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime()).slice(0, count);
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [style, classes, otherStyles] = await Promise.all([
    getStyleBySlug(slug),
    getClassesByStyleSlug(slug),
    getActiveStyles(),
  ]);

  if (!style) notFound();

  const hasSchedule = classes.length > 0;
  const upcoming = getUpcomingDates(
    classes.map((c) => ({
      day_of_week: c.day_of_week,
      starts_at_time: c.starts_at_time,
    })),
    4,
  );

  return (
    <article>
      {/* Hero con cover */}
      <section className="relative pt-16 min-h-[80svh] flex items-end">
        {style.cover_url && (
          <Image
            src={style.cover_url}
            alt={style.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10"
        />

        <div className="container relative z-10 pb-16 md:pb-24">
          <Link
            href="/clases"
            className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Todas las clases
          </Link>

          <p className="eyebrow">Clase</p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mt-4 leading-[0.95] text-balance">
            {style.name}
          </h1>
          {style.tagline && (
            <p className="mt-6 text-lg md:text-xl text-bone-mute max-w-xl text-pretty">
              {style.tagline}
            </p>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="container py-20 md:py-28">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-20">
          {/* Columna izquierda: descripción */}
          <div>
            <p className="eyebrow mb-4">Sobre la clase</p>
            <p className="text-lg md:text-xl text-bone leading-relaxed text-pretty">
              {style.description}
            </p>

            <div className="hairline my-12" />

            <p className="eyebrow mb-6">Horarios recurrentes</p>
            {hasSchedule ? (
              <ul className="space-y-3">
                {classes.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 font-mono text-sm uppercase tracking-wider"
                  >
                    <span className="w-1 h-1 rounded-full bg-lumen" />
                    {dayNamesLong[c.day_of_week]} · {formatTime(c.starts_at_time)}
                    <span className="text-bone-mute"> · {c.studios.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-bone-mute italic">
                Próximamente. Escríbenos para confirmar el siguiente ciclo.
              </p>
            )}
          </div>

          {/* Columna derecha: ficha técnica + reserva */}
          <aside className="lg:sticky lg:top-24 self-start space-y-6">
            <div className="glass rounded-2xl p-6 space-y-5">
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 mt-1 text-lumen shrink-0" />
                <div>
                  <p className="eyebrow text-bone-mute mb-1">Edad recomendada</p>
                  <p className="text-sm">{style.age_range ?? "Abierto"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-1 text-lumen shrink-0" />
                <div>
                  <p className="eyebrow text-bone-mute mb-1">Duración</p>
                  <p className="text-sm">{style.duration_min} minutos</p>
                </div>
              </div>
            </div>

            {/* Próximas sesiones (preview hasta tener BD de class_sessions) */}
            <div className="rounded-2xl border border-bone-border/40 p-6">
              <p className="eyebrow mb-4">Próximas sesiones</p>
              {upcoming.length > 0 ? (
                <ul className="space-y-3 mb-6">
                  {upcoming.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm py-2 border-b border-bone-border/30 last:border-0"
                    >
                      <span className="font-mono uppercase tracking-wider text-bone">
                        {formatSessionDate(d)}
                      </span>
                      <span className="text-bone-mute font-mono">
                        {String(d.getHours()).padStart(2, "0")}:
                        {String(d.getMinutes()).padStart(2, "0")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-bone-mute text-sm mb-6 italic">
                  Aún no hay sesiones programadas.
                </p>
              )}

              <Link
                href={`/auth/login?next=/clases/${style.slug}`}
                className={cn(
                  "group w-full inline-flex items-center justify-center gap-2",
                  "bg-bone text-ink font-medium px-6 py-3 rounded-full",
                  "hover:bg-lumen transition-colors",
                  !hasSchedule && "pointer-events-none opacity-50",
                )}
              >
                Reservar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <p className="text-xs text-bone-mute text-center mt-3">
                ¿Aún no eres alumna?{" "}
                <Link
                  href="/planes"
                  className="text-bone underline hover:text-lumen"
                >
                  Ver planes
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Otras clases */}
      <section className="container pb-32">
        <div className="hairline mb-12" />
        <p className="eyebrow mb-6">Otras clases</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {otherStyles
            .filter((s) => s.slug !== style.slug)
            .slice(0, 4)
            .map((s) => (
              <Link key={s.slug} href={`/clases/${s.slug}`} className="group">
                <div className="relative aspect-[1/1.4] rounded-t-capsule rounded-b-capsule overflow-hidden border border-bone-border/30 group-hover:border-lumen transition-colors">
                  {s.cover_url && (
                    <Image
                      src={s.cover_url}
                      alt={s.name}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  )}
                </div>
                <p className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-bone group-hover:text-lumen transition-colors">
                    {s.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-bone-mute group-hover:text-lumen transition-colors" />
                </p>
              </Link>
            ))}
        </div>
      </section>
    </article>
  );
}
