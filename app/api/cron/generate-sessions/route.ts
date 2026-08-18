import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron llama este endpoint una vez al día (ver vercel.json).
 * Genera 6 semanas de sesiones hacia adelante para toda clase activa —
 * así ninguna coreógrafa tiene que acordarse de darlas de alta a mano.
 * Idempotente: correrlo de más no duplica nada.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "generate_sessions_all_active_classes",
    { p_weeks_ahead: 6 },
  );

  if (error) {
    console.error("[cron/generate-sessions] falló:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const totalSessions = rows.reduce(
    (sum, r) => sum + (r.sessions_created ?? 0),
    0,
  );

  console.log(
    `[cron/generate-sessions] ${rows.length} clase(s) con sesiones nuevas, ${totalSessions} sesión(es) creada(s) en total.`,
  );

  return NextResponse.json({
    ok: true,
    classesUpdated: rows.length,
    sessionsCreated: totalSessions,
    detail: rows,
  });
}
