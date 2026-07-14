import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { AuthHashHandler } from "@/components/auth/auth-hash-handler";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthHashHandler />
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
