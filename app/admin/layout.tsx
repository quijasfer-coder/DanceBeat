import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Users,
  UserCog,
  UserCheck,
  Inbox,
  CreditCard,
  Settings,
  Image as ImageIcon,
  LogOut,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: Inbox, badge: "pending" as const },
  { href: "/admin/clases", label: "Clases", icon: Calendar },
  { href: "/admin/eventos", label: "Eventos", icon: Sparkles },
  { href: "/admin/galeria", label: "Galería", icon: ImageIcon },
  { href: "/admin/coreografos", label: "Coreógrafos", icon: UserCog },
  { href: "/admin/audiciones", label: "Audiciones", icon: UserCheck },
  { href: "/admin/alumnos", label: "Alumnos", icon: Users },
  { href: "/admin/planes", label: "Planes", icon: CreditCard },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin("/admin");
  const supabase = await createClient();
  const { count: pendingCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("account_status", "pending");

  return (
    <div className="min-h-[100svh] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-bone-border/30 bg-ink-off flex flex-col">
        <div className="p-6 border-b border-bone-border/30">
          <Link href="/" className="block">
            <p className="font-display text-xl">Dance Beat</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mt-1">
              Admin
            </p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const showBadge =
              item.badge === "pending" && (pendingCount ?? 0) > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
                  "text-bone-mute hover:text-bone hover:bg-ink-surface transition-colors",
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-warning/20 text-warning text-[10px] font-mono font-medium">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-bone-border/30">
          <p className="text-xs text-bone mb-1">{profile.full_name}</p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-bone-mute mb-3">
            {profile.email}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 text-xs text-bone-mute hover:text-danger transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
