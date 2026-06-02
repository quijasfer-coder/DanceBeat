import { createClient } from "@/lib/supabase/server";

/**
 * Lee múltiples settings en una sola query.
 * Útil para hidratar la UI con constantes (cancel_window_hours,
 * enrollment_fee_cents, etc.) sin hacer N queries.
 */
export async function getSettings(
  keys: readonly string[],
): Promise<Record<string, string | undefined>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", keys as string[]);

  if (error) throw error;

  const result: Record<string, string | undefined> = {};
  for (const k of keys) result[k] = undefined;
  const rows = (data ?? []) as Array<{ key: string; value: string }>;
  for (const row of rows) result[row.key] = row.value;
  return result;
}

/** Lee un setting individual; devuelve fallback si no existe. */
export async function getSetting(
  key: string,
  fallback: string,
): Promise<string> {
  const map = await getSettings([key]);
  return map[key] ?? fallback;
}
