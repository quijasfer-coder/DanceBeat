import Link from "next/link";
import { Calendar, Users, CreditCard, Building2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin · Overview",
  robots: { index: false },
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // Conteos rápidos en paralelo
  const [classes, students, plans, studios, bookings] = await Promise.all([
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase
      .from("plans")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("studios")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),
  ]);

  const stats = [
    {
      label: "Clases activas",
      value: classes.count ?? 0,
      icon: Calendar,
      href: "/admin/clases",
    },
    {
      label: "Alumnos registrados",
      value: students.count ?? 0,
      icon: Users,
      href: "/admin/alumnos",
    },
    {
      label: "Planes activos",
      value: plans.count ?? 0,
      icon: CreditCard,
      href: "/admin/planes",
    },
    {
      label: "Sucursales",
      value: studios.count ?? 0,
      icon: Building2,
      href: "#",
    },
    {
      label: "Reservas confirmadas",
      value: bookings.count ?? 0,
      icon: Calendar,
      href: "/admin/clases",
    },
  ];

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Dashboard
        </p>
        <h1 className="font-display text-5xl mt-2">Overview</h1>
        <p className="text-sm text-bone-mute mt-3">
          Estado general de la academia.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group glass rounded-2xl p-6 hover:border-lumen/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <Icon className="w-5 h-5 text-lumen" />
                <ArrowRight className="w-4 h-4 text-bone-mute opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-display text-5xl text-bone">{s.value}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mt-3">
                {s.label}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-16 hairline" />

      <div className="mt-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-4">
          Acciones rápidas
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/clases"
            className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
          >
            Gestionar clases
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-bone-border/60 hover:border-bone px-5 py-2.5 rounded-full text-sm transition-colors"
          >
            Ver sitio público
          </Link>
        </div>
      </div>
    </div>
  );
}
