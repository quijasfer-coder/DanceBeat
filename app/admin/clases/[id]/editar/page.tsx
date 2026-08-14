import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditClassForm } from "./edit-form";
import { DeleteClassButton } from "./delete-class-button";

export const metadata = {
  title: "Admin · Editar clase",
  robots: { index: false },
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EditClassPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [classRes, studiosRes, teachersRes] = await Promise.all([
    supabase.from("classes").select("*").eq("id", id).maybeSingle(),
    supabase.from("studios").select("id, name").eq("is_active", true),
    supabase
      .from("teachers")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  const danceClass = classRes.data;
  if (!danceClass) notFound();

  const { data: style } = await supabase
    .from("styles")
    .select("id, slug, name, tagline, description, age_range, cover_url")
    .eq("id", danceClass.style_id)
    .maybeSingle();

  if (!style) notFound();

  // Conteos para el bloque "danger zone": cuántas sesiones futuras y
  // reservas activas hay para que el admin sepa qué se va a borrar.
  const nowIso = new Date().toISOString();
  const [futureSessionsRes, activeBookingsRes] = await Promise.all([
    supabase
      .from("class_sessions")
      .select("id", { count: "exact", head: true })
      .eq("class_id", danceClass.id)
      .gte("starts_at", nowIso),
    supabase
      .from("class_sessions")
      .select("bookings(id)", { count: "exact" })
      .eq("class_id", danceClass.id),
  ]);
  const futureSessionsCount = futureSessionsRes.count ?? 0;

  // Bookings activos (status confirmed/attended) — los contamos via JS por
  // simplicidad (vol. bajo en MVP).
  const { data: bookingsRows } = await supabase
    .from("bookings")
    .select("id, class_sessions!inner(class_id)")
    .eq("class_sessions.class_id", danceClass.id)
    .in("status", ["confirmed", "attended"]);
  const activeBookingsCount = (bookingsRows ?? []).length;
  void activeBookingsRes;

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
          Editar clase
        </p>
        <h1 className="font-display text-5xl mt-2">{style.name}</h1>
      </div>

      {/* Nota informativa */}
      <div className="mb-10 rounded-2xl border border-lumen/30 bg-lumen/5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-3">
          Cómo se estructura una clase
        </p>
        <p className="text-sm text-bone-mute leading-relaxed text-pretty">
          Una clase tiene dos capas:{" "}
          <strong className="text-bone">"Contenido público"</strong> (nombre,
          tagline, descripción — lo que la alumna lee para decidir si tomarla)
          y{" "}
          <strong className="text-bone">"Programación operativa"</strong>{" "}
          (cuándo, dónde, cuánto cupo — lo que el sistema usa para mostrar el
          calendario y procesar reservas). Ambas se editan aquí y los cambios
          se reflejan en el sitio público al guardar.
        </p>
      </div>

      <EditClassForm
        classId={danceClass.id}
        styleId={style.id}
        styleSlug={style.slug}
        initial={{
          style_name: style.name,
          style_tagline: style.tagline,
          style_description: style.description,
          style_age_range: style.age_range,
          style_cover_url: style.cover_url,
          studio_id: danceClass.studio_id,
          teacher_id: danceClass.teacher_id,
          day_of_week: danceClass.day_of_week,
          starts_at_time: danceClass.starts_at_time.slice(0, 5),
          duration_min: danceClass.duration_min,
          level: danceClass.level,
          capacity: danceClass.capacity,
          age_min: danceClass.age_min,
          age_max: danceClass.age_max,
          is_active: danceClass.is_active,
          is_public: danceClass.is_public,
        }}
        studios={studiosRes.data ?? []}
        teachers={teachersRes.data ?? []}
      />

      <DeleteClassButton
        classId={danceClass.id}
        className={style.name}
        futureSessionsCount={futureSessionsCount}
        activeBookingsCount={activeBookingsCount}
      />
    </div>
  );
}
