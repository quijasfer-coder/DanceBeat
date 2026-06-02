import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "../event-form";

export const metadata = {
  title: "Admin · Nuevo evento",
  robots: { index: false },
};

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data: studios } = await supabase
    .from("studios")
    .select("id, name")
    .eq("is_active", true);

  return (
    <div className="p-10 max-w-3xl pb-32">
      <Link
        href="/admin/eventos"
        className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a eventos
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Crear evento
        </p>
        <h1 className="font-display text-5xl mt-2">Nuevo evento</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Crea el evento primero y luego, en su detalle, asigna a las alumnas
          y administra pagos y asistencia.
        </p>
      </div>

      <EventForm mode="create" studios={studios ?? []} />
    </div>
  );
}
