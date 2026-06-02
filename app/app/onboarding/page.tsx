import { requireAuth } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "Bienvenida · Onboarding",
  robots: { index: false },
};

export default async function OnboardingPage() {
  const profile = await requireAuth("/app/onboarding");

  return (
    <div className="container py-16 max-w-2xl">
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-lumen">
          Paso 1 — Antes de reservar
        </p>
        <h1 className="font-display text-5xl mt-2 leading-[0.95]">
          Cuéntanos quién
          <br />
          <span className="italic text-bone-mute">va a bailar.</span>
        </h1>
        <p className="text-sm text-bone-mute mt-4 text-pretty">
          Tu cuenta puede tener varios alumnos asociados. Por ejemplo, si eres
          mamá o papá puedes registrar a tus hijos aquí. Todos los pagos y
          notificaciones llegan a tu cuenta, pero cada alumno tiene sus
          propias clases y créditos.
        </p>
      </div>

      <OnboardingForm
        accountHolderName={profile.full_name}
        accountHolderPhone={profile.phone ?? ""}
      />
    </div>
  );
}
