import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireApprovedAccount } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { EditStudentForm } from "./edit-student-form";

export const metadata = {
  title: "Editar alumno",
  robots: { index: false },
};

export default async function EditarAlumnoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireApprovedAccount(`/app/alumno/${id}/editar`);
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // Solo el titular de la cuenta puede editar a sus propios alumnos.
  if (!student || student.account_id !== profile.id) notFound();

  let curpViewUrl: string | null = null;
  if (student.curp_pdf_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("student-documents")
      .createSignedUrl(student.curp_pdf_path, 60 * 10);
    curpViewUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="container py-16 max-w-2xl">
      <Link
        href="/app"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-lumen transition-colors mb-8"
      >
        <ArrowLeft className="w-3 h-3" />
        Volver a mi cuenta
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-lumen">
          Editar alumno
        </p>
        <h1 className="font-display text-5xl mt-2">{student.full_name}</h1>
        <p className="text-sm text-bone-mute mt-3 text-pretty">
          Agrega la foto de perfil o completa los datos que falten — se
          actualiza de inmediato.
        </p>
      </div>

      <EditStudentForm
        accountId={profile.id}
        student={student}
        curpViewUrl={curpViewUrl}
      />
    </div>
  );
}
