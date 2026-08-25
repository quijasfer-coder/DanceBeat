import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { AdminNewStudentForm } from "./admin-new-student-form";

export const metadata = {
  title: "Admin · Registrar alumna",
  robots: { index: false },
};

type SearchParams = Promise<{ accountId?: string; returnTo?: string }>;

export default async function AdminNuevaAlumnaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin("/admin/alumnos/nueva");
  const { accountId, returnTo } = await searchParams;
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name");

  const accountOptions = profiles ?? [];
  const preselected = accountId
    ? accountOptions.find((p) => p.id === accountId) ?? null
    : null;

  return (
    <div className="p-10 max-w-2xl">
      <Link
        href={returnTo || "/admin/alumnos"}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-lumen transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Volver
      </Link>

      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Personas
        </p>
        <h1 className="font-display text-5xl mt-2">Registrar alumna</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-lg">
          Úsalo cuando un papá/mamá ya tiene cuenta pero nunca agregó a su
          hija — captura los datos aquí mismo (por teléfono, WhatsApp, etc.)
          y la alumna queda lista en su cuenta.
        </p>
      </div>

      <AdminNewStudentForm
        accountOptions={accountOptions}
        preselectedAccount={preselected}
        returnTo={returnTo ?? "/admin/alumnos"}
      />
    </div>
  );
}
