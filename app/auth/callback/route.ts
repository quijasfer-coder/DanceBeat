import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase redirige aquí después de que el usuario hace clic en el link
 * del email con ?code=... y ?type=...
 *
 * recovery   → reenvía a /auth/reset-password (el code se intercambia allí)
 * signup     → intercambia code, redirige a /app
 * invite     → intercambia code, redirige a /auth/reset-password (debe elegir pwd)
 * email_change → intercambia code, redirige a /app
 * (sin type) → tratado como recovery (ver nota abajo)
 * otros      → intercambia code, redirige a /app
 *
 * Nota: si el Redirect URLs del dashboard de Supabase no incluye esta ruta,
 * Supabase descarta el `redirectTo` completo (incluido `?type=`) y manda al
 * usuario al Site URL con solo `?code=`. AuthHashHandler reenvía ese code
 * suelto aquí sin `type`. Como el flujo de recovery es el más común y el
 * más afectado por esto, tratamos "sin type" igual que "recovery" — es la
 * opción segura (el usuario solo llega a la pantalla de nueva contraseña,
 * nunca se le da una sesión iniciada sin querer).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (!code) {
    return NextResponse.redirect(`${origin}/`);
  }

  // Recovery (o sin type, ver nota arriba): el code lo intercambia /auth/reset-password
  if (type === "recovery" || !type) {
    return NextResponse.redirect(
      `${origin}/auth/reset-password?code=${code}`,
    );
  }

  // Invite: intercambiamos el code aquí y mandamos a crear contraseña
  if (type === "invite") {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  // signup, email_change y cualquier otro: intercambiar y mandar a /app
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=link_invalido`);
  }

  return NextResponse.redirect(`${origin}/app`);
}
