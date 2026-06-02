"use client";

import { useTransition } from "react";
import { toggleTeacherActiveAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function ToggleActive({
  teacherId,
  active,
}: {
  teacherId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleTeacherActiveAction(teacherId, !active);
        })
      }
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50",
        active
          ? "bg-success/10 text-success border-success/30 hover:bg-success/20"
          : "bg-bone-border/10 text-bone-mute border-bone-border/40 hover:bg-bone-border/20",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          active ? "bg-success" : "bg-bone-mute",
        )}
      />
      {active ? "Activo" : "Inactivo"}
    </button>
  );
}
