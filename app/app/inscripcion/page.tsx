import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, MessageCircle, CheckCircle2 } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getSetting } from "@/lib/queries/settings";
import { formatMxn } from "@/lib/format";

export const metadata = {
  title: "Inscripción pendiente",
  robots: { index: false },
};

export default async function InscripcionPage() {
  const profile = await requireAuth("/app/inscripcion");

  if (profile.account_status === "pending") redirect("/app/pendiente");
  if (profile.account_status === "rejected") redirect("/app/rechazado");
  if (profile.enrolled_at) redirect("/app");

  const enrollmentFeeRaw = await getSetting("enrollment_fee_cents", "160000");
  const enrollmentFee = parseInt(enrollmentFeeRaw, 10);

  return (
    <div className="container py-16 max-w-2xl">
      <div className="text-center mb-10">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-success/15 text-success items-center justify-center mb-6">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <p className="eyebrow text-success mb-3">Cuenta aprobada</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95] text-balance">
          Falta tu pago de
          <br />
          <span className="italic text-lumen">inscripción.</span>
        </h1>
        <p className="mt-6 text-bone-mute text-pretty">
          Para activar tu acceso completo y empezar a contratar planes,
          completa el pago único de inscripción.
        </p>
      </div>

      <div className="glass rounded-2xl p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
          <div>
            <p className="eyebrow text-lumen">Inscripción</p>
            <p className="font-display text-5xl mt-3">{formatMxn(enrollmentFee)}</p>
            <p className="text-xs text-bone-mute mt-2 font-mono uppercase tracking-wider">
              Pago único
            </p>
          </div>
          <div className="flex-1">
            <p className="text-bone-mute text-pretty">
              Cubre tu registro, kit de bienvenida y acceso a la plataforma.
              No se cobra de nuevo mientras tu cuenta siga activa.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          disabled
          className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-medium bg-bone-mute/10 text-bone-mute cursor-not-allowed"
        >
          <CreditCard className="w-4 h-4" />
          Pagar en línea (próximamente)
        </button>
        <a
          href="https://wa.me/525500000000?text=Hola,%20quiero%20pagar%20mi%20inscripci%C3%B3n%20a%20Dance%20Beat"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-medium bg-bone text-ink hover:bg-lumen transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Pagar por WhatsApp / efectivo
        </a>
        <p className="text-center text-xs text-bone-mute mt-3">
          Una vez recibido tu pago, el equipo activará tu cuenta y podrás
          contratar tu plan de clases.
        </p>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/app/onboarding"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-bone transition-colors"
        >
          Agregar más alumnos a mi cuenta →
        </Link>
      </div>
    </div>
  );
}
