import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const LUMINARIA_TICKETS_URL = "https://www.goliiive.com/el-alma-y-el-mar";

export function LuminariaCta() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Spotlight más intenso para Luminaria */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(184,164,255,0.18), rgba(0,0,0,0) 70%)",
        }}
      />

      <div className="container relative text-center">
        <p className="eyebrow text-lumen">El show del ciclo</p>

        <h2 className="font-display text-6xl md:text-8xl lg:text-9xl mt-6 leading-[0.9] text-balance">
          <span className="italic">Luminaria.</span>
        </h2>

        <p className="mt-8 text-lg text-bone-mute max-w-xl mx-auto text-pretty">
          Cada ciclo, todas las alumnas de Dance Beat se reúnen para llevar al
          escenario lo aprendido. Un show que es la culminación natural de la
          formación.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={LUMINARIA_TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 bg-lumen text-ink px-8 py-4 rounded-full font-medium hover:bg-bone transition-colors"
          >
            Compra tus boletos
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link
            href="/luminaria"
            className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors"
          >
            Conoce el concepto →
          </Link>
        </div>
      </div>
    </section>
  );
}
