import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { requireTeacher, getAvailableModes } from "@/lib/auth";
import { signOutAction } from "@/app/auth/actions";
import { RoleSwitcher } from "@/components/role-switcher";

export default async function ProfesorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireTeacher("/profesor");
  const modes = await getAvailableModes(profile);

  return (
    <div className="min-h-[100svh] flex flex-col">
      <header className="border-b border-bone-border/30 bg-ink-off">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/profesor" className="flex items-center gap-2">
            <Image
              src="/logos/DB_white_1@300x.png"
              alt="Dance Beat"
              width={28}
              height={32}
            />
            <div className="leading-tight">
              <span className="font-display text-lg block">Dance Beat</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-lumen">
                Coreógrafos
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/profesor/perfil"
              className="text-sm text-bone-mute hover:text-bone transition-colors"
            >
              Mi perfil
            </Link>
            <RoleSwitcher
              modes={modes}
              current={profile.role === "admin" ? "admin" : "teacher"}
            />
            <p className="text-sm text-bone-mute">
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
