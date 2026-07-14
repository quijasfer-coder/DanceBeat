import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  if (!code) {
    redirect("/auth/recuperar");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect("/auth/recuperar");
  }

  return <ResetPasswordForm />;
}
