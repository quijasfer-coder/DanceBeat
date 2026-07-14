import { RegistroForm } from "@/components/auth/registro-form";
import { getPlanByCode, type PlanCode } from "@/lib/queries/plans";

export const metadata = {
  title: "Crear cuenta",
  description: "Únete a Dance Beat Academy.",
  robots: { index: false },
};

type SearchParams = Promise<{ plan?: string }>;

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { plan: planCode } = await searchParams;

  const selectedPlan = planCode
    ? await getPlanByCode(planCode as PlanCode)
    : null;

  return <RegistroForm selectedPlan={selectedPlan ?? undefined} />;
}
