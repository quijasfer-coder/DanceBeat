import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cliente Supabase para Server Components y Route Handlers.
 * Lee/escribe cookies del request actual para mantener la sesión.
 * NO usar en `generateStaticParams` ni en otras funciones que corren
 * fuera de un request — usa `createPublicClient()` ahí.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde Server Component — el middleware refresca las cookies.
          }
        },
      },
    },
  );
}

/**
 * Cliente Supabase con service role — bypasea RLS completamente.
 * Usar SOLO en server actions de admin donde se necesite modificar
 * filas que pertenecen a otros usuarios.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Cliente Supabase SIN cookies, para uso en contextos fuera de request:
 * `generateStaticParams`, `generateMetadata` durante prerender, scripts,
 * etc. Solo puede leer datos que estén permitidos a `anon` por RLS.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
