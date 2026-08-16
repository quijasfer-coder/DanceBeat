import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";
import { getCurrentProfile } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <>
      <AuthHashHandler />
      <Nav profile={profile ? { full_name: profile.full_name } : null} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
