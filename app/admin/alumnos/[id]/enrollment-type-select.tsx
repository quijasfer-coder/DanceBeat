"use client";

import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";
import { setStudentEnrollmentTypeAction } from "./actions";

export function EnrollmentTypeSelect({
  studentId,
  enrollmentTypes,
  currentId,
}: {
  studentId: string;
  enrollmentTypes: { id: string; name: string; price_cents: number }[];
  currentId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(currentId ?? "");

  const handleChange = (id: string) => {
    setValue(id);
    setError(null);
    startTransition(async () => {
      const res = await setStudentEnrollmentTypeAction(studentId, id);
      if (res.error) setError(res.error);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={pending}
        className="bg-ink-surface border border-bone-border/40 rounded-lg px-3 py-1.5 text-xs text-bone focus:outline-none focus:border-lumen transition-colors disabled:opacity-50"
      >
        <option value="">— Sin tipo asignado —</option>
        {enrollmentTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} · {(t.price_cents / 100).toLocaleString("es-MX")}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin text-bone-mute" />}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
