import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { NewClassForm } from "./new-class-form";

export const metadata = {
  title: "Admin · Nueva clase",
  robots: { index: false },
};

export default async function NewClassPage() {
  await requireAdmin("/admin/clases/nueva");
  const supabase = await createClient();

  const [stylesRes, studiosRes, teachersRes] = await Promise.all([
    supabase
      .from("styles")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("studios")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("teachers")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  return (
    <div className="p-10 max-w-3xl pb-32">
      <Link
        href="/admin/clases"
        className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al listado
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Nueva clase
        </p>
        <h1 className="font-display text-5xl mt-2">Crear clase</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Una clase es una sesión recurrente: un día, una hora, una sucursal,
          un coreógrafo. Puede usar un estilo del catálogo (ej. "otro horario
          de Jazz") o crear un estilo nuevo.
        </p>
      </div>

      <NewClassForm
        styles={stylesRes.data ?? []}
        studios={studiosRes.data ?? []}
        teachers={teachersRes.data ?? []}
      />
    </div>
  );
}
