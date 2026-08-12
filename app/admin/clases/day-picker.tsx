"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const dayOptions = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export function DayPicker({
  selected,
  onChange,
  options = dayOptions,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
  options?: typeof dayOptions;
}) {
  function toggle(val: number) {
    onChange(
      selected.includes(val) ? selected.filter((d) => d !== val) : [...selected, val],
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((d) => {
        const active = selected.includes(d.value);
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => toggle(d.value)}
            className={cn(
              "relative px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
              active
                ? "bg-lumen text-ink border-lumen"
                : "border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
            )}
          >
            {active && <Check className="inline w-3 h-3 mr-1.5 -mt-0.5" />}
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
