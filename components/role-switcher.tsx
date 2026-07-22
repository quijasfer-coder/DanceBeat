import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AppMode, ModeOption } from "@/lib/auth";

export function RoleSwitcher({
  modes,
  current,
}: {
  modes: ModeOption[];
  current: AppMode;
}) {
  if (modes.length < 2) return null;

  return (
    <div className="inline-flex items-center rounded-full border border-bone-border/30 bg-ink-surface p-0.5">
      {modes.map((m) => (
        <Link
          key={m.mode}
          href={m.href}
          className={cn(
            "px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest transition-colors",
            m.mode === current
              ? "bg-lumen text-ink"
              : "text-bone-mute hover:text-bone",
          )}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}
