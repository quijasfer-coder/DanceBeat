import Image from "next/image";

/**
 * Foto de perfil circular de un alumno (o iniciales si no tiene foto).
 * `students.photo_url` ya existía en el schema — este es el primer lugar
 * que lo usa.
 */
export function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <div
        className={`relative shrink-0 rounded-full overflow-hidden border border-bone-border/40 bg-ink-surface ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized={!src.includes("supabase.co")}
        />
      </div>
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center border border-bone-border/40 bg-ink-surface text-bone-mute font-mono ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
