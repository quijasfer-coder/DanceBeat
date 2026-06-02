import { RecuperarForm } from "@/components/auth/recuperar-form";

export const metadata = {
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta.",
  robots: { index: false },
};

export default function RecuperarPage() {
  return <RecuperarForm />;
}
