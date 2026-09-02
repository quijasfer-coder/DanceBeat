import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeMX } from "@/lib/format";
import { StatusSelector } from "./status-selector";
import { NotesForm } from "./notes-form";
import { DeleteAuditionButton } from "./delete-button";

export const metadata = {
  title: "Admin · Aplicación IMPULSE",
  robots: { index: false },
};

export default async function AuditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("/admin/audiciones");
  const { id } = await params;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("audition_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!application) notFound();

  // Reviewer info
  let reviewerName: string | null = null;
  if (application.reviewed_by) {
    const { data: reviewer } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", application.reviewed_by)
      .maybeSingle();
    reviewerName =
      reviewer?.full_name || reviewer?.email || application.reviewed_by;
  }

  const createdAt = formatDateTimeMX(application.created_at, {
    dateStyle: "long",
    timeStyle: "short",
  });
  const reviewedAt = application.reviewed_at
    ? formatDateTimeMX(application.reviewed_at, {
        dateStyle: "long",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="p-10 max-w-4xl">
      <Link
        href="/admin/audiciones"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-lumen transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Volver al listado
      </Link>

      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Aplicación · recibida {createdAt}
        </p>
        <h1 className="font-display text-5xl mt-2">{application.full_name}</h1>
      </div>

      {/* Status selector */}
      <div className="glass rounded-2xl p-6 mb-6">
        <StatusSelector
          applicationId={application.id}
          initialStatus={application.status}
        />
        {reviewedAt && (
          <p className="text-xs text-bone-mute mt-4 font-mono uppercase tracking-wider">
            Revisada el {reviewedAt}
            {reviewerName ? ` por ${reviewerName}` : ""}
          </p>
        )}
      </div>

      {/* Datos de contacto */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <a
          href={`mailto:${application.email}`}
          className="glass rounded-2xl p-5 hover:border-lumen/40 transition-colors group"
        >
          <Mail className="w-4 h-4 text-lumen mb-3" />
          <p className="text-xs font-mono uppercase tracking-widest text-bone-mute mb-1">
            Email
          </p>
          <p className="text-bone group-hover:text-lumen transition-colors break-all">
            {application.email}
          </p>
        </a>
        <a
          href={`tel:${application.phone}`}
          className="glass rounded-2xl p-5 hover:border-lumen/40 transition-colors group"
        >
          <Phone className="w-4 h-4 text-lumen mb-3" />
          <p className="text-xs font-mono uppercase tracking-widest text-bone-mute mb-1">
            Teléfono
          </p>
          <p className="text-bone group-hover:text-lumen transition-colors">
            {application.phone}
          </p>
        </a>
      </div>

      {/* Datos del perfil */}
      <div className="glass rounded-2xl p-6 mb-6 space-y-6">
        {application.age !== null && (
          <Field
            icon={<Calendar className="w-4 h-4" />}
            label="Edad"
            value={`${application.age} años`}
          />
        )}
        {application.styles && (
          <Field
            icon={<Sparkles className="w-4 h-4" />}
            label="Estilos"
            value={application.styles}
          />
        )}
        {application.experience && (
          <Field
            icon={<GraduationCap className="w-4 h-4" />}
            label="Experiencia"
            value={application.experience}
          />
        )}
        {application.why_impulse && (
          <Field
            icon={<Sparkles className="w-4 h-4" />}
            label="¿Por qué IMPULSE?"
            value={application.why_impulse}
          />
        )}
        {application.video_url && (
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute mb-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Video
            </div>
            <a
              href={application.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lumen hover:text-bone underline underline-offset-4 break-all"
            >
              {application.video_url}
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}
      </div>

      {/* Notas internas */}
      <div className="glass rounded-2xl p-6 mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-bone-mute mb-4">
          Notas internas
        </p>
        <NotesForm
          applicationId={application.id}
          initialNotes={application.notes ?? ""}
        />
      </div>

      {/* Eliminar */}
      <div className="pt-4 border-t border-bone-border/30">
        <DeleteAuditionButton applicationId={application.id} />
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute mb-2">
        {icon}
        {label}
      </div>
      <p className="text-bone leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}
