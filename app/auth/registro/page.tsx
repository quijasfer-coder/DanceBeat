import { RegistroForm } from "@/components/auth/registro-form";
import { getPlanByCode, type PlanCode } from "@/lib/queries/plans";
import { getSetting } from "@/lib/queries/settings";

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

  const [selectedPlan, enrollmentFeeStr] = await Promise.all([
    planCode ? getPlanByCode(planCode as PlanCode) : Promise.resolve(null),
    getSetting("enrollment_fee_cents", "160000"),
  ]);

  const enrollmentFeeCents = parseInt(enrollmentFeeStr, 10);

  return (
    <RegistroForm
      selectedPlan={selectedPlan ?? undefined}
      enrollmentFeeCents={enrollmentFeeCents}
    />
  );
}
