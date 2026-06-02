"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAuditionAction } from "../actions";

export function DeleteAuditionButton({
  applicationId,
}: {
  applicationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    if (
      !confirm(
        "¿Eliminar esta aplicación permanentemente? Esta acción no se puede deshacer.",
      )
    )
      return;
    startTransition(async () => {
      await deleteAuditionAction(applicationId);
      router.push("/admin/audiciones");
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-2 text-xs text-bone-mute hover:text-danger disabled:opacity-50 transition-colors"
    >
      <Trash2 className="w-3 h-3" />
      {pending ? "Eliminando…" : "Eliminar aplicación"}
    </button>
  );
}
