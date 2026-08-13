import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { requireAuth, getAvailableModes } from "@/lib/auth";
import { signOutAction } from "@/app/auth/actions";
import { RoleSwitcher } from "@/components/role-switcher";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth("/app");
  const modes = await getAvailableModes(profile);

  const supabase = await createClient();
  const { count } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("account_id", profile.id)
    .not("enrolled_at", "is", null);
  const hasEnrolledStudent = (count ?? 0) > 0;

  return (
    <div className="min-h-[100svh] flex flex-col">
      {/* Top bar */}
      <header className="border-b border-bone-border/30 bg-ink-off">
        <div className="container flex h-16 items-center justify-between gap-6">
          <Link href="/app" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logos/DB_white_1@300x.png"
              alt="Dance Beat"
              width={28}
              height={32}
            />
            <span className="font-display text-lg leading-none">
              Dance Beat
            </span>
          </Link>

          {profile.account_status === "approved" && hasEnrolledStudent && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/app"
                className="text-sm text-bone-mute hover:text-bone transition-colors"
              >
                Mi cuenta
              </Link>
              <Link
                href="/app/reservar"
                className="text-sm text-bone-mute hover:text-bone transition-colors"
              >
                Reservar
              </Link>
              <Link
                href="/app/reservas"
                className="text-sm text-bone-mute hover:text-bone transition-colors"
              >
                Mis reservas
              </Link>
              <Link
                href="/app/planes"
                className="text-sm text-bone-mute hover:text-bone transition-colors"
              >
                Planes
              </Link>
              <Link
                href="/app/eventos"
                className="text-sm text-bone-mute hover:text-bone transition-colors"
              >
                Eventos
              </Link>
              <Link
                href="/app/galeria"
                className="text-sm text-bone-mute hover:text-bone transition-colors"
              >
                Galería
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-6">
            <RoleSwitcher modes={modes} current="student" />
            <p className="hidden sm:block text-sm text-bone-mute">
              <span className="text-bone">{profile.full_name}</span>
            </p>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 text-sm text-bone-mute hover:text-danger transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
