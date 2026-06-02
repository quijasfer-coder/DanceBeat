import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de Dance Beat Academy.",
  robots: { index: false },
};

type SearchParams = Promise<{ next?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
