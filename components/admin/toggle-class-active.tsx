"use client";

import { useTransition } from "react";
import { toggleClassActiveAction } from "@/app/admin/actions";

export function ToggleClassActive({
  classId,
  isActive,
}: {
  classId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      toggleClassActiveAction(classId, !isActive);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-bone transition-colors disabled:opacity-40"
      title={isActive ? "Desactivar clase" : "Activar clase"}
    >
      {isPending ? (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-bone-mute border-t-transparent animate-spin" />
      ) : (
        <span
          className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
            isActive
              ? "border-success bg-success/20"
              : "border-bone-mute/40 bg-transparent"
          }`}
        />
      )}
      {isActive ? "Desactivar" : "Activar"}
    </button>
  );
}
