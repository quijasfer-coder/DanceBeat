import { RecuperarForm } from "@/components/auth/recuperar-form";

export const metadata = {
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta.",
  robots: { index: false },
};

type SearchParams = Promise<{ linkError?: string }>;

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { linkError } = await searchParams;
  return <RecuperarForm linkError={linkError} />;
}
