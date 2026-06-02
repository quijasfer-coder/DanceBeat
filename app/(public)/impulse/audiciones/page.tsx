import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { getSetting } from "@/lib/queries/settings";
import { AuditionForm } from "./audition-form";

export const metadata = {
  title: "Audiciones IMPULSE",
  description:
    "Aplica a las audiciones de IMPULSE, la compañía representativa de Dance Beat.",
};

export default async function AudicionesPage() {
  const open = await getSetting("impulse_auditions_open", "false");
  const isOpen = open === "true";
  const closedMessage = await getSetting(
    "impulse_auditions_message",
    "Las audiciones están cerradas por ahora.",
  );

  return (
    <div>
      {/* HERO */}
      <section className="pt-40 pb-12 md:pt-48 md:pb-16">
        <div className="container">
          <Link
            href="/impulse"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-lumen transition-colors mb-8"
          >
            <ArrowLeft className="w-3 h-3" />
            Volver a IMPULSE
          </Link>

          <p className="eyebrow text-lumen">Compañía representativa</p>
          <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[0.9] text-balance">
            Audiciones
            <br />
            <span className="italic text-bone-mute">IMPULSE.</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-bone-mute max-w-2xl text-pretty">
            Llena la siguiente aplicación. Si tu perfil encaja, el equipo te
            contactará por email para coordinar tu audición presencial.
          </p>
        </div>
      </section>

      {/* FORM o mensaje cerrado */}
      <section className="container pb-32">
        {isOpen ? (
          <AuditionForm />
        ) : (
          <div className="glass rounded-2xl p-10 md:p-14 text-center max-w-2xl mx-auto">
            <Lock className="w-10 h-10 text-bone-mute mx-auto mb-6" />
            <p className="eyebrow mb-4">Convocatoria cerrada</p>
            <h2 className="font-display text-3xl md:text-4xl text-bone leading-[0.95] mb-6 text-balance">
              Por ahora no estamos
              <br />
              <span className="italic text-bone-mute">recibiendo aplicaciones.</span>
            </h2>
            <p className="text-bone-mute leading-relaxed whitespace-pre-line text-pretty">
              {closedMessage}
            </p>
            <Link
              href="/impulse"
              className="inline-flex items-center justify-center gap-2 mt-10 border border-bone-border/60 hover:border-bone px-6 py-3 rounded-full text-sm text-bone hover:bg-bone/5 transition-all"
            >
              Volver a IMPULSE
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
