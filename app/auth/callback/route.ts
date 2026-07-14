import { NextRequest, NextResponse } from "next/server";

/**
 * Supabase redirige aquí después de que el usuario hace clic en el link
 * del email (password reset, confirmación, etc.) con ?code=... y ?type=...
 * Lo único que hacemos es reenviar a la página correcta según el tipo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/app";

  if (!code) {
    return NextResponse.redirect(`${origin}/`);
  }

  if (type === "recovery") {
    return NextResponse.redirect(
      `${origin}/auth/reset-password?code=${code}`,
    );
  }

  // Para email confirmation y otros tipos, redirigir al destino
  return NextResponse.redirect(`${origin}${next}`);
}
