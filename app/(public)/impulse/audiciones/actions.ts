"use server";

import { createClient } from "@/lib/supabase/server";
import { getSetting } from "@/lib/queries/settings";

export type AuditionFormState =
  | { error?: string; success?: string }
  | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

export async function createAuditionApplicationAction(
  _prev: AuditionFormState,
  formData: FormData,
): Promise<AuditionFormState> {
  // Re-validar setting en server: previene bypass si el cliente abrió la página
  // mientras estaba abierto y la admin la cerró antes del submit.
  const open = await getSetting("impulse_auditions_open", "false");
  if (open !== "true") {
    return {
      error:
        "Las audiciones están cerradas. Si crees que esto es un error, contáctanos.",
    };
  }

  const fullName = ((formData.get("full_name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const ageRaw = ((formData.get("age") as string) ?? "").trim();
  const experience = ((formData.get("experience") as string) ?? "").trim();
  const videoUrl = ((formData.get("video_url") as string) ?? "").trim();
  const whyImpulse = ((formData.get("why_impulse") as string) ?? "").trim();
  const styles = ((formData.get("styles") as string) ?? "").trim();

  if (!fullName) return { error: "Tu nombre completo es obligatorio." };
  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Email inválido." };
  }
  if (!phone) return { error: "Teléfono obligatorio." };

  let age: number | null = null;
  if (ageRaw) {
    const parsed = parseInt(ageRaw, 10);
    if (isNaN(parsed) || parsed < 5 || parsed > 90) {
      return { error: "Edad inválida." };
    }
    age = parsed;
  }

  if (videoUrl && !URL_RE.test(videoUrl)) {
    return {
      error: "El link del video debe empezar con http:// o https://",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("audition_applications").insert({
    full_name: fullName,
    email,
    phone,
    age,
    experience: experience || null,
    video_url: videoUrl || null,
    why_impulse: whyImpulse || null,
    styles: styles || null,
  });

  if (error) {
    return { error: `No pudimos guardar tu aplicación: ${error.message}` };
  }

  return {
    success:
      "Recibimos tu aplicación. El equipo de IMPULSE la revisará y te contactaremos por email.",
  };
}
