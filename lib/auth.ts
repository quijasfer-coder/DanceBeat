import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Devuelve a qué pantalla debe ir un profile según su `account_status`
 * y si al menos una de sus alumnas ya pagó su inscripción. `null`
 * significa que puede acceder a la pantalla solicitada sin redirect.
 *
 * La inscripción es por ALUMNA, no por cuenta — pero para entrar al
 * portal basta con que una esté inscrita; cuál puede reservar y cuál no
 * se filtra dentro de /app/reservar y en el RPC book_class.
 */
export function getAccountGateRedirect(
  profile: Profile,
  hasEnrolledStudent: boolean,
): string | null {
  if (profile.account_status === "pending") return "/app/pendiente";
  if (profile.account_status === "rejected") return "/app/rechazado";
  if (!hasEnrolledStudent) return "/app/inscripcion";
  return null;
}

/**
 * Devuelve el profile del usuario autenticado, o null si no hay sesión.
 * Para uso en server components.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
}

/**
 * Exige sesión. Redirige a /auth/login?next=<path> si no hay usuario.
 */
export async function requireAuth(redirectTo: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/auth/login?next=${encodeURIComponent(redirectTo)}`);
  }
  return profile;
}

/**
 * Exige sesión + cuenta `approved` + inscripción pagada.
 * Redirige a la pantalla correspondiente si falta algún gate.
 * Úsala en cualquier página dentro de /app que requiera acceso completo.
 */
export async function requireApprovedAccount(
  redirectTo: string,
): Promise<Profile> {
  const profile = await requireAuth(redirectTo);
  const supabase = await createClient();
  const { count } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("account_id", profile.id)
    .not("enrolled_at", "is", null);
  const hasEnrolledStudent = (count ?? 0) > 0;

  const gate = getAccountGateRedirect(profile, hasEnrolledStudent);
  if (gate) redirect(gate);
  return profile;
}

/**
 * Exige rol admin. Redirige a / si no es admin (usuario logueado pero
 * sin permisos suficientes), o a login si no hay sesión.
 */
export async function requireAdmin(redirectTo: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/auth/login?next=${encodeURIComponent(redirectTo)}`);
  }
  if (profile.role !== "admin") {
    redirect("/");
  }
  return profile;
}

/**
 * Exige rol teacher (coreógrafo) o admin. Admin queda permitido para
 * que pueda inspeccionar lo que ve un coreógrafo sin cambiar de cuenta.
 */
export async function requireTeacher(redirectTo: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/auth/login?next=${encodeURIComponent(redirectTo)}`);
  }
  if (profile.role !== "teacher" && profile.role !== "admin") {
    redirect("/");
  }
  return profile;
}

export type AppMode = "admin" | "teacher" | "student";

export interface ModeOption {
  mode: AppMode;
  href: string;
  label: string;
}

const MODE_META: Record<AppMode, { href: string; label: string }> = {
  admin: { href: "/admin", label: "Admin" },
  teacher: { href: "/profesor", label: "Profesor" },
  student: { href: "/app", label: "Alumno" },
};

/**
 * Modos (admin/profesor/alumno) a los que este profile tiene acceso real
 * hoy mismo, para mostrar el selector de modo solo cuando aplica y solo
 * con destinos que no lo manden a una pantalla de "no vinculado".
 */
export async function getAvailableModes(
  profile: Profile,
): Promise<ModeOption[]> {
  const modes: AppMode[] = [];

  if (profile.role === "admin") modes.push("admin");

  if (profile.role === "admin" || profile.role === "teacher") {
    const supabase = await createClient();
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (teacher) modes.push("teacher");
  }

  if (profile.account_status === "approved" && profile.enrolled_at) {
    modes.push("student");
  }

  return modes.map((mode) => ({ mode, ...MODE_META[mode] }));
}
