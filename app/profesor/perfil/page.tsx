import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth";
import { EditProfileForm } from "./edit-profile-form";

export const metadata = {
  title: "Profesor · Mi perfil",
  robots: { index: false },
};

export default async function ProfesorPerfilPage() {
  const profile = await requireTeacher("/profesor/perfil");
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("full_name, photo_url, emergency_contact_name, emergency_contact_phone")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) {
    return (
      <div className="container py-16 max-w-2xl">
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-2xl text-bone mb-2">
                Tu cuenta no está vinculada a un coreógrafo
              </p>
              <p className="text-sm text-bone-mute">
                Pídele al equipo administrativo que te dé de alta en
                /admin/coreografos y vincule este email a tu perfil.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-2xl pb-24">
      <Link
        href="/profesor"
        className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis clases
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Coreógrafo
        </p>
        <h1 className="font-display text-5xl mt-2">Mi perfil</h1>
      </div>

      <EditProfileForm teacher={teacher} />
    </div>
  );
}
