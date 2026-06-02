import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Devuelve a qué pantalla debe ir un profile según su `account_status`
 * y si pagó la inscripción. `null` significa que puede acceder a la
 * pantalla solicitada sin ningún redirect.
 */
export function getAccountGateRedirect(profile: Profile): string | null {
  if (profile.account_status === "pending") return "/app/pendiente";
  if (profile.account_status === "rejected") return "/app/rechazado";
  if (!profile.enrolled_at) return "/app/inscripcion";
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
  const gate = getAccountGateRedirect(profile);
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
