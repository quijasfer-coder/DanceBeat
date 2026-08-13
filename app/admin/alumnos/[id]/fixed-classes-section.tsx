"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Search,
  AlertCircle,
  Loader2,
  Clock,
  MapPin,
  Users,
  Zap,
} from "lucide-react";
import { assignFixedClassAction, unassignFixedClassAction } from "./actions";
import { cn } from "@/lib/utils";

type FixedClass = { id: string; label: string };
type ClassOption = {
  id: string;
  styleName: string;
  studioName: string;
  dayOfWeek: number;
  time: string;
  level: string;
  capacity: number;
};

const dayPills = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];
const dayLabelFull: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export function FixedClassesSection({
  studentId,
  fixedClasses,
  availableClasses,
  creditsRemaining,
  creditsTotal,
}: {
  studentId: string;
  fixedClasses: FixedClass[];
  availableClasses: ClassOption[];
  creditsRemaining: number;
  creditsTotal: number;
}) {
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unassign = (classId: string) => {
    if (
      !confirm(
        "¿Quitar esta clase fija? Se cancelan sus reservas futuras de esa clase y se devuelven los créditos.",
      )
    )
      return;
    setError(null);
    setPendingId(classId);
    startTransition(async () => {
      const res = await unassignFixedClassAction(studentId, classId);
      if (res.error) setError(res.error);
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <CreditsCounter remaining={creditsRemaining} total={creditsTotal} />

      {fixedClasses.length === 0 ? (
        <p className="text-xs text-bone-mute">Sin clases fijas asignadas.</p>
      ) : (
        <div className="space-y-2">
          {fixedClasses.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-bone-border/30 bg-ink-off px-3 py-2 text-sm"
            >
              <span className="text-bone">{c.label}</span>
              <button
                type="button"
                onClick={() => unassign(c.id)}
                disabled={pending && pendingId === c.id}
                className="inline-flex items-center gap-1 text-xs text-bone-mute hover:text-danger transition-colors disabled:opacity-50 shrink-0"
              >
                {pending && pendingId === c.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      <AddFixedClassButton
        studentId={studentId}
        availableClasses={availableClasses}
        creditsRemaining={creditsRemaining}
      />
    </div>
  );
}

function CreditsCounter({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-bone-border/30 bg-ink-off px-4 py-3">
      <Zap className="w-4 h-4 text-lumen shrink-0" />
      <div>
        <p className="font-display text-4xl leading-none text-lumen">
          {remaining}
          <span className="text-base text-bone-mute font-body"> / {total}</span>
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mt-1">
          Créditos disponibles
        </p>
      </div>
    </div>
  );
}

function AddFixedClassButton({
  studentId,
  availableClasses,
  creditsRemaining,
}: {
  studentId: string;
  availableClasses: ClassOption[];
  creditsRemaining: number;
}) {
  const [open, setOpen] = useState(false);
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assign = (classId: string) => {
    setError(null);
    setPendingId(classId);
    startTransition(async () => {
      const res = await assignFixedClassAction(studentId, classId);
      if (res.error) setError(res.error);
      setPendingId(null);
    });
  };

  const filtered = availableClasses.filter((c) => {
    if (dayFilter !== null && c.dayOfWeek !== dayFilter) return false;
    if (search && !c.styleName.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  // Agrupado por día cuando no hay filtro de día activo, para que se
  // pueda escanear "todas las de lunes juntas" sin perder el resto.
  const grouped = new Map<number, ClassOption[]>();
  for (const c of filtered) {
    const arr = grouped.get(c.dayOfWeek) ?? [];
    arr.push(c);
    grouped.set(c.dayOfWeek, arr);
  }
  const groupOrder = [1, 2, 3, 4, 5, 6, 0].filter((d) => grouped.has(d));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium border border-bone-border/40 text-bone hover:border-lumen hover:text-lumen transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Agregar clase fija
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-bone-border/40 bg-ink-off shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 p-5 border-b border-bone-border/30">
              <div>
                <p className="font-display text-xl text-bone">Agregar clase fija</p>
                <p className="text-xs text-bone-mute mt-0.5">
                  Elige un día y toca una clase para asignarla.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p
                    className={cn(
                      "font-display text-3xl leading-none",
                      creditsRemaining > 0 ? "text-lumen" : "text-danger",
                    )}
                  >
                    {creditsRemaining}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-bone-mute mt-1">
                    créditos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-bone-mute hover:text-bone transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-5 pb-3 space-y-3 border-b border-bone-border/30">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setDayFilter(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors",
                    dayFilter === null
                      ? "bg-bone text-ink"
                      : "border border-bone-border/40 text-bone-mute hover:text-bone",
                  )}
                >
                  Todos
                </button>
                {dayPills.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDayFilter(d.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors",
                      dayFilter === d.value
                        ? "bg-bone text-ink"
                        : "border border-bone-border/40 text-bone-mute hover:text-bone",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-bone-mute" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre de clase…"
                  className="w-full bg-ink-surface border border-bone-border/40 rounded-full pl-9 pr-4 py-2 text-sm text-bone placeholder:text-bone-mute/50 focus:outline-none focus:border-lumen transition-colors"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {filtered.length === 0 ? (
                <p className="text-sm text-bone-mute text-center py-8">
                  No hay clases que coincidan.
                </p>
              ) : (
                groupOrder.map((day) => (
                  <div key={day}>
                    {dayFilter === null && (
                      <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-2">
                        {dayLabelFull[day]}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {grouped.get(day)!.map((c) => {
                        const isPending = pending && pendingId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={pending}
                            onClick={() => assign(c.id)}
                            className={cn(
                              "text-left rounded-xl border border-bone-border/30 bg-ink-surface p-3.5 transition-colors disabled:opacity-50",
                              !isPending && "hover:border-lumen/50 hover:bg-lumen/5",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-display text-base text-bone truncate">
                                {c.styleName}
                              </p>
                              {isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-lumen shrink-0 mt-0.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-bone-mute shrink-0 mt-0.5" />
                              )}
                            </div>
                            <dl className="mt-2 space-y-1 text-[11px] text-bone-mute">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {dayPills.find((d) => d.value === c.dayOfWeek)?.label}{" "}
                                {c.time}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                {c.studioName}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3 h-3" />
                                {c.capacity} lugares · {c.level}
                              </div>
                            </dl>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {error && (
                <p className="flex items-center gap-1.5 text-xs text-danger">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
            </div>
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}
