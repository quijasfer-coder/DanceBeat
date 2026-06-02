import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";
import { requireAuth } from "@/lib/auth";

export const metadata = {
  title: "Solicitud no aprobada",
  robots: { index: false },
};

export default async function RechazadoPage() {
  const profile = await requireAuth("/app/rechazado");

  if (profile.account_status === "approved") redirect("/app");
  if (profile.account_status === "pending") redirect("/app/pendiente");

  return (
    <div className="container py-16 max-w-2xl">
      <div className="text-center mb-10">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-danger/15 text-danger items-center justify-center mb-6">
          <XCircle className="w-6 h-6" />
        </div>
        <p className="eyebrow text-danger mb-3">Solicitud no aprobada</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95] text-balance">
          No pudimos aprobar
          <br />
          <span className="italic text-bone-mute">tu cuenta.</span>
        </h1>
        <p className="mt-6 text-bone-mute text-pretty">
          Si crees que esto es un error o quieres más detalles, contáctanos por
          WhatsApp.
        </p>
      </div>

      {profile.rejection_reason && (
        <div className="glass rounded-2xl p-6 mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2">
            Nota del equipo
          </p>
          <p className="text-bone leading-relaxed whitespace-pre-line">
            {profile.rejection_reason}
          </p>
        </div>
      )}
    </div>
  );
}
