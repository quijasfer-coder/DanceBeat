import Link from "next/link";
import { Clock, ArrowRight, MapPin } from "lucide-react";
import {
  getActiveClasses,
  type ClassWithStyleAndStudio,
} from "@/lib/queries/schedule";
import { getActiveStyles } from "@/lib/queries/styles";

export const metadata = {
  title: "Horarios",
  description:
    "Calendario semanal de clases. Heels, HipHop · Afro, Ritmos Latinos, Mix Styles y más.",
};

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function formatTime(t: string): string {
  // "19:30:00" → "7:30 PM"
  const [hStr, m] = t.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m} ${period}`;
}

type DaySchedule = {
  dayOfWeek: number;
  dayLabel: string;
  sessions: ClassWithStyleAndStudio[];
};

function buildWeeklySchedule(
  classes: ClassWithStyleAndStudio[],
): DaySchedule[] {
  const week: DaySchedule[] = dayLabels.map((dayLabel, dayOfWeek) => ({
    dayOfWeek,
    dayLabel,
    sessions: [],
  }));

  for (const c of classes) {
    week[c.day_of_week].sessions.push(c);
  }
  for (const day of week) {
    day.sessions.sort((a, b) => a.starts_at_time.localeCompare(b.starts_at_time));
  }
  return week;
}

export default async function HorariosPage() {
  const [classes, styles] = await Promise.all([
    getActiveClasses(),
    getActiveStyles(),
  ]);

  const weeklySchedule = buildWeeklySchedule(classes);
  const daysWithSessions = weeklySchedule.filter((d) => d.sessions.length > 0);

  // Estilos sin clase recurrente confirmada — para sección "Próximamente"
  const stylesWithClasses = new Set(classes.map((c) => c.style_id));
  const upcomingStyles = styles.filter((s) => !stylesWithClasses.has(s.id));

  return (
    <div>
      {/* HERO */}
      <section className="relative pt-40 pb-16 md:pt-48 md:pb-20 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(184,164,255,0.1), rgba(0,0,0,0) 70%)",
          }}
        />
        <div className="container relative">
          <p className="eyebrow">Calendario</p>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl mt-6 leading-[0.9] text-balance">
            Horarios
            <br />
            <span className="italic text-bone-mute">de la semana.</span>
          </h1>
          <p className="mt-10 text-lg text-bone-mute max-w-xl text-pretty">
            {daysWithSessions.length} días activos · {classes.length} clases
            recurrentes.
          </p>
        </div>
      </section>

      {/* CALENDARIO SEMANAL */}
      <section className="container py-12 md:py-20">
        {/* Desktop: grid horizontal Lun-Vie */}
        <div className="hidden md:grid md:grid-cols-5 gap-4">
          {weeklySchedule
            .filter((d) => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)
            .map((day) => (
              <div key={day.dayOfWeek} className="space-y-3">
                <div className="text-center pb-4 border-b border-bone-border/30">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-lumen">
                    {day.dayLabel.slice(0, 3)}
                  </p>
                  <p className="font-display text-2xl mt-2">{day.dayLabel}</p>
                </div>

                {day.sessions.length === 0 ? (
                  <p className="text-center text-bone-mute italic text-sm py-8">
                    Sin clases
                  </p>
                ) : (
                  day.sessions.map((c) => (
                    <Link
                      key={c.id}
                      href={`/clases/${c.styles.slug}`}
                      className="block group"
                    >
                      <div className="glass rounded-xl p-5 hover:border-lumen/40 transition-all">
                        <p className="font-mono text-xs uppercase tracking-wider text-lumen mb-2">
                          {formatTime(c.starts_at_time)}
                        </p>
                        <p className="font-display text-xl text-bone group-hover:text-lumen transition-colors leading-tight">
                          {c.styles.name}
                        </p>
                        <p className="text-xs text-bone-mute mt-2">
                          {c.duration_min} min
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            ))}
        </div>

        {/* Mobile: stack por día (solo días con clases) */}
        <div className="md:hidden space-y-10">
          {daysWithSessions.map((day) => (
            <div key={day.dayOfWeek}>
              <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-bone-border/30">
                <p className="font-display text-3xl">{day.dayLabel}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-mute">
                  {day.sessions.length}{" "}
                  {day.sessions.length === 1 ? "clase" : "clases"}
                </p>
              </div>

              <ul className="space-y-3">
                {day.sessions.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clases/${c.styles.slug}`}
                      className="group glass rounded-xl p-5 flex items-center gap-5 hover:border-lumen/40 transition-all"
                    >
                      <div className="text-center shrink-0 w-20 border-r border-bone-border/30 pr-4">
                        <p className="font-mono text-xs uppercase tracking-wider text-lumen">
                          {formatTime(c.starts_at_time).split(" ")[0]}
                        </p>
                        <p className="font-mono text-[10px] text-bone-mute mt-0.5">
                          {formatTime(c.starts_at_time).split(" ")[1]}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xl text-bone group-hover:text-lumen transition-colors">
                          {c.styles.name}
                        </p>
                        <p className="text-xs text-bone-mute mt-1">
                          {c.duration_min} min
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-bone-mute group-hover:text-lumen group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* PRÓXIMAMENTE — clases sin horario confirmado */}
      {upcomingStyles.length > 0 && (
        <section className="container py-20">
          <div className="hairline mb-16" />

          <div className="text-center mb-12">
            <p className="eyebrow text-lumen">Próximamente</p>
            <h2 className="font-display text-4xl md:text-5xl mt-4 leading-[0.95]">
              Más clases
              <br />
              <span className="italic text-bone-mute">en camino.</span>
            </h2>
            <p className="mt-6 text-bone-mute max-w-md mx-auto">
              Estas clases tienen horario por confirmar para el siguiente ciclo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {upcomingStyles.map((s) => (
              <Link
                key={s.slug}
                href={`/clases/${s.slug}`}
                className="group glass rounded-xl p-5 hover:border-lumen/40 transition-all text-center"
              >
                <Clock className="w-4 h-4 text-bone-mute group-hover:text-lumen transition-colors mx-auto mb-3" />
                <p className="font-display text-lg text-bone group-hover:text-lumen transition-colors leading-tight">
                  {s.name}
                </p>
                {s.age_range && (
                  <p className="text-xs text-bone-mute mt-2">{s.age_range}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* INFO PRÁCTICA */}
      <section className="container py-32">
        <div className="hairline mb-16" />

        <div className="grid md:grid-cols-2 gap-10 max-w-3xl mx-auto">
          <div className="glass rounded-2xl p-8">
            <MapPin className="w-5 h-5 text-lumen mb-4" />
            <p className="font-display text-2xl mb-3">Sucursal</p>
            <p className="text-sm text-bone-mute leading-relaxed">
              Av. Stim 1348 (Sótano 1), Lomas del Chamizal, Cuajimalpa.
            </p>
            <Link
              href="/academy#sucursales"
              className="inline-flex items-center gap-1 text-sm text-bone hover:text-lumen mt-6 transition-colors"
            >
              Ver dirección
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="glass rounded-2xl p-8">
            <Clock className="w-5 h-5 text-lumen mb-4" />
            <p className="font-display text-2xl mb-3">Reserva tu lugar</p>
            <p className="text-sm text-bone-mute leading-relaxed">
              Las clases tienen cupo limitado. Para reservar tu lugar necesitas
              una cuenta y un plan activo.
            </p>
            <Link
              href="/planes"
              className="inline-flex items-center gap-1 text-sm text-bone hover:text-lumen mt-6 transition-colors"
            >
              Ver planes
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
