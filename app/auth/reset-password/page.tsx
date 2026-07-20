import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Nueva contraseña",
  description: "Establece una nueva contraseña para tu cuenta.",
  robots: { index: false },
};

type SearchParams = Promise<{ code?: string }>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { code } = await searchParams;

  const supabase = await createClient();

  if (code) {
    // Flujo PKCE: intercambiar code por sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Sin este log no hay forma de saber por qué falló el intercambio
      // (code ya usado, code_verifier ausente, link viejo, etc.) — antes
      // se perdía por completo y el usuario caía en el form vacío.
      console.error(
        "[reset-password] exchangeCodeForSession falló:",
        error.code,
        error.message,
      );
      redirect(`/auth/recuperar?linkError=${error.code ?? "exchange_failed"}`);
    }
  } else {
    // Flujo implícito: la sesión ya fue establecida por AuthHashHandler en el cliente
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/recuperar");
  }

  return <ResetPasswordForm />;
}
