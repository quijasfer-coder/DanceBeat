"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | null;

/** Login con email + password. Devuelve error o redirige a `next` (default `/app`). */
export async function signInAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/app";

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: friendlyError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

/** Registro: crea usuario en auth.users; trigger handle_new_user inserta el profile. */
export async function signUpAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!email || !password || !fullName) {
    return { error: "Nombre, email y contraseña son requeridos." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
    },
  });

  if (error) {
    return { error: friendlyError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/app");
}

/** Cierra sesión y redirige al home. */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Envía email de recuperación de contraseña. */
export async function recoverPasswordAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "Email es requerido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) return { error: friendlyError(error.message) };

  return { error: undefined };
}

// ─── Mensajes user-friendly ──────────────────────────────────────────

function friendlyError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email o contraseña incorrectos.",
    "Email not confirmed":
      "Confirma tu email antes de iniciar sesión (revisa tu bandeja).",
    "User already registered": "Ya existe una cuenta con ese email.",
    "Password should be at least 6 characters":
      "La contraseña debe tener al menos 6 caracteres.",
  };
  return map[message] ?? message;
}
