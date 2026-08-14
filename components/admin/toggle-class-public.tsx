"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toggleClassPublicAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function ToggleClassPublic({
  classId,
  isPublic,
}: {
  classId: string;
  isPublic: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      toggleClassPublicAction(classId, !isPublic);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs transition-colors disabled:opacity-40",
        isPublic ? "text-lumen hover:text-bone" : "text-bone-mute hover:text-bone",
      )}
      title={
        isPublic
          ? "Visible en el sitio público — click para ocultarla"
          : "Oculta del sitio público — click para mostrarla"
      }
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isPublic ? (
        <Eye className="w-3.5 h-3.5" />
      ) : (
        <EyeOff className="w-3.5 h-3.5" />
      )}
      {isPublic ? "Pública" : "Oculta"}
    </button>
  );
}
