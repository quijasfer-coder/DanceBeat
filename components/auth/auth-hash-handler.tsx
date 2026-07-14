"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Detecta el flujo implícito de Supabase (#access_token= en el hash).
 * Cuando Supabase envía el link de recovery con el token en el hash,
 * este componente lo intercepta y redirige al formulario correcto.
 */
export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const type = params.get("type");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !type) return;

    if (type === "recovery") {
      // Establecemos la sesión manualmente y redirigimos al formulario
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken ?? "" })
        .then(() => {
          router.replace("/auth/reset-password");
        });
    }
  }, [router]);

  return null;
}
