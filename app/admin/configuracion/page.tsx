import { CheckCircle2 } from "lucide-react";
import { getSettings } from "@/lib/queries/settings";
import { SettingsForm } from "./settings-form";

export const metadata = {
  title: "Admin · Configuración",
  robots: { index: false },
};

type SearchParams = Promise<{ saved?: string }>;

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { saved } = await searchParams;
  const settings = await getSettings([
    "enrollment_fee_cents",
    "late_fee_pct",
    "late_fee_day_of_month",
    "cancel_window_hours",
    "cycle_length_weeks",
  ]);

  return (
    <div className="p-10 max-w-3xl pb-32">
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Reglas de la academia
        </p>
        <h1 className="font-display text-5xl mt-2">Configuración</h1>
        <p className="text-sm text-bone-mute mt-3">
          Ajusta las constantes de cobranza y operación. Los cambios se
          aplican inmediatamente al sitio público.
        </p>
      </div>

      {saved === "1" && (
        <div className="mb-6 flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-sm text-bone">
            Configuración guardada correctamente.
          </p>
        </div>
      )}

      <div className="mb-10 rounded-2xl border border-lumen/30 bg-lumen/5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-3">
          Importante
        </p>
        <p className="text-sm text-bone-mute leading-relaxed">
          Estos valores definen cómo cobra y opera la academia: precio de
          inscripción, ventana de cancelación y reglas de recargo. Cambiarlos
          afecta a todos los alumnos a partir de su próximo cargo. No
          retroactivo.
        </p>
      </div>

      <SettingsForm
        initial={{
          enrollment_fee_mxn:
            parseInt(settings.enrollment_fee_cents ?? "350000", 10) / 100,
          late_fee_pct: parseFloat(settings.late_fee_pct ?? "0.10"),
          late_fee_day_of_month: parseInt(
            settings.late_fee_day_of_month ?? "10",
            10,
          ),
          cancel_window_hours: parseInt(
            settings.cancel_window_hours ?? "12",
            10,
          ),
          cycle_length_weeks: parseInt(
            settings.cycle_length_weeks ?? "4",
            10,
          ),
        }}
      />
    </div>
  );
}
