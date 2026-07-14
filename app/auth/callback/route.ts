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
 * otros      → intercambia code, redirige a /app
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (!code) {
    return NextResponse.redirect(`${origin}/`);
  }

  // Recovery: el code lo intercambia la página /auth/reset-password
  if (type === "recovery") {
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
