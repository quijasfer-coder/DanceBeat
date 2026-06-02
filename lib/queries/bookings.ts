import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type StyleRow = Database["public"]["Tables"]["styles"]["Row"];
type StudioRow = Database["public"]["Tables"]["studios"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type SessionRow = Database["public"]["Tables"]["class_sessions"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type SubRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type PlanRow = Database["public"]["Tables"]["plans"]["Row"];

export type BookableSession = SessionRow & {
  capacity: number;
  classes: Pick<ClassRow, "id" | "duration_min" | "level"> & {
    styles: Pick<StyleRow, "id" | "slug" | "name" | "tagline" | "cover_url">;
    studios: Pick<StudioRow, "id" | "slug" | "name">;
    teacher_name: string | null;
  };
};

/**
 * Sesiones programadas en los próximos N días, con cupo disponible y datos
 * suficientes para mostrarlas en el calendario de reservas.
 */
export async function getUpcomingBookableSessions(
  daysAhead: number = 14,
): Promise<BookableSession[]> {
  const supabase = await createClient();
  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("class_sessions")
    .select(
      `
      *,
      classes:class_id (
        id, duration_min, level, capacity,
        styles:style_id ( id, slug, name, tagline, cover_url ),
        studios:studio_id ( id, slug, name ),
        teachers:teacher_id ( full_name )
      )
      `,
    )
    .eq("status", "scheduled")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  if (error) throw error;

  // Aplanar teacher.full_name → teacher_name y derivar capacity efectiva
  const rows = (data ?? []) as Array<
    SessionRow & {
      classes:
        | (Pick<ClassRow, "id" | "duration_min" | "level" | "capacity"> & {
            styles: Pick<StyleRow, "id" | "slug" | "name" | "tagline" | "cover_url">;
            studios: Pick<StudioRow, "id" | "slug" | "name">;
            teachers: { full_name: string } | null;
          })
        | null;
    }
  >;

  return rows
    .filter((r) => r.classes !== null)
    .map((r) => ({
      ...r,
      capacity: r.capacity_override ?? r.classes!.capacity,
      classes: {
        id: r.classes!.id,
        duration_min: r.classes!.duration_min,
        level: r.classes!.level,
        styles: r.classes!.styles,
        studios: r.classes!.studios,
        teacher_name: r.classes!.teachers?.full_name ?? null,
      },
    }));
}

export type MyBooking = BookingRow & {
  class_sessions: SessionRow & {
    classes: Pick<ClassRow, "duration_min"> & {
      styles: Pick<StyleRow, "name" | "slug">;
      studios: Pick<StudioRow, "name">;
      teacher_name: string | null;
    };
  };
};

/**
 * Reservas activas (confirmadas, en el futuro) de los students del usuario.
 */
export async function getMyActiveBookings(
  studentIds: string[],
): Promise<MyBooking[]> {
  if (studentIds.length === 0) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      class_sessions:session_id (
        *,
        classes:class_id (
          duration_min,
          styles:style_id ( name, slug ),
          studios:studio_id ( name ),
          teachers:teacher_id ( full_name )
        )
      )
      `,
    )
    .in("student_id", studentIds)
    .in("status", ["confirmed", "attended"])
    .order("session_id", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as Array<
    BookingRow & {
      class_sessions:
        | (SessionRow & {
            classes:
              | (Pick<ClassRow, "duration_min"> & {
                  styles: Pick<StyleRow, "name" | "slug">;
                  studios: Pick<StudioRow, "name">;
                  teachers: { full_name: string } | null;
                })
              | null;
          })
        | null;
    }
  >;

  const now = new Date();
  return rows
    .filter(
      (r) =>
        r.class_sessions !== null &&
        r.class_sessions.classes !== null &&
        new Date(r.class_sessions.starts_at) >= now,
    )
    .map((r) => ({
      ...r,
      class_sessions: {
        ...r.class_sessions!,
        classes: {
          duration_min: r.class_sessions!.classes!.duration_min,
          styles: r.class_sessions!.classes!.styles,
          studios: r.class_sessions!.classes!.studios,
          teacher_name: r.class_sessions!.classes!.teachers?.full_name ?? null,
        },
      },
    }))
    .sort(
      (a, b) =>
        new Date(a.class_sessions.starts_at).getTime() -
        new Date(b.class_sessions.starts_at).getTime(),
    );
}

export type StudentSubscription = SubRow & {
  plans: Pick<PlanRow, "name" | "code" | "credits_per_month">;
};

/**
 * Devuelve la suscripción activa de cada student (si existe). Mapa
 * student_id → suscripción.
 */
export async function getActiveSubscriptionsForStudents(
  studentIds: string[],
): Promise<Map<string, StudentSubscription>> {
  if (studentIds.length === 0) return new Map();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      plans:plan_id ( name, code, credits_per_month )
      `,
    )
    .in("student_id", studentIds)
    .eq("status", "active");

  if (error) throw error;

  const rows = (data ?? []) as StudentSubscription[];
  const map = new Map<string, StudentSubscription>();
  for (const row of rows) map.set(row.student_id, row);
  return map;
}

/**
 * IDs de session reservadas activamente por los students del usuario.
 * Útil para deshabilitar el botón "Reservar" en sesiones donde ya tienen
 * lugar.
 */
export async function getActiveBookingsForStudents(
  studentIds: string[],
): Promise<Map<string, Set<string>>> {
  if (studentIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("session_id, student_id")
    .in("student_id", studentIds)
    .in("status", ["confirmed", "attended"]);

  if (error) throw error;

  const map = new Map<string, Set<string>>();
  for (const row of (data ?? []) as Array<{
    session_id: string;
    student_id: string;
  }>) {
    let set = map.get(row.session_id);
    if (!set) {
      set = new Set<string>();
      map.set(row.session_id, set);
    }
    set.add(row.student_id);
  }
  return map;
}
