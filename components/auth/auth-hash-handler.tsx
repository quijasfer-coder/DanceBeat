"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Detecta el flujo implícito de Supabase (#access_token= en el hash).
 * Cuando Supabase envía el link de recovery con el token en el hash,
 * este componente lo intercepta y redirige al formulario correcto.
 *
 * También detecta el caso de error: si el link de recovery ya expiró o
 * fue usado, Supabase redirige al Site URL (home) con `error=...` en el
 * hash y/o la query string, en vez de mandarlo a /auth/callback. Sin
 * esto, el usuario cae en el home sin ninguna explicación.
 *
 * Red de seguridad adicional: si el Site URL / Redirect URLs configurados
 * en el dashboard de Supabase no incluyen /auth/callback, Supabase ignora
 * el `redirectTo` solicitado y manda al usuario al Site URL raíz (home)
 * con un `?code=...` suelto en la query string, sin `type`. Sin esto, ese
 * code nunca se intercambia y el usuario cae en el home sin explicación
 * — el bug reportado de "el link de recuperar contraseña no hace nada".
 * Lo correcto es arreglar el Redirect URLs en Supabase, pero esto evita
 * que el flujo se rompa mientras tanto (o si vuelve a desconfigurarse).
 */
export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    const hashParams = new URLSearchParams(hash.slice(1));
    const searchParams = new URLSearchParams(search);
    const errorCode =
      hashParams.get("error_code") ?? searchParams.get("error_code");

    if (errorCode) {
      router.replace(`/auth/recuperar?linkError=${errorCode}`);
      return;
    }

    const strayCode = searchParams.get("code");
    if (strayCode) {
      router.replace(`/auth/callback?code=${strayCode}`);
      return;
    }

    if (!hash) return;

    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !type) return;

    // "recovery" (olvidé mi contraseña) e "invite" (coreógrafa invitada
    // desde /admin/coreografos) terminan en la misma pantalla: crear
    // contraseña. Sin "invite" aquí, el link de invitación caía en el
    // home sin hacer nada — mismo bug que ya pasaba con recovery.
    if (type === "recovery" || type === "invite") {
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
