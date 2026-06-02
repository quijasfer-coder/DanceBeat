import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Music2 } from "lucide-react";

const cols = [
  {
    title: "Academia",
    links: [
      { href: "/clases", label: "Clases" },
      { href: "/horarios", label: "Horarios" },
      { href: "/planes", label: "Planes" },
      { href: "/academy", label: "Academy" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { href: "/luminaria", label: "Luminaria" },
      { href: "/comunidad", label: "Blog" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/auth/login", label: "Iniciar sesión" },
      { href: "/auth/registro", label: "Crear cuenta" },
      { href: "/app", label: "Mi dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacidad", label: "Privacidad" },
      { href: "/legal/terminos", label: "Términos" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-bone-border/30 bg-ink-off mt-32">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {cols.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-bone hover:text-lumen transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline mt-16 mb-8" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex items-start gap-4">
            <Image
              src="/logos/DB_white@300x.png"
              alt="Dance Beat Academy"
              width={140}
              height={50}
              className="opacity-90"
            />
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <div className="flex gap-4">
              <Link
                href="https://instagram.com"
                aria-label="Instagram"
                className="text-bone-mute hover:text-lumen transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="https://facebook.com"
                aria-label="Facebook"
                className="text-bone-mute hover:text-lumen transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="https://tiktok.com"
                aria-label="TikTok"
                className="text-bone-mute hover:text-lumen transition-colors"
              >
                <Music2 className="w-5 h-5" />
              </Link>
            </div>
            <p className="font-mono text-xs text-bone-mute">
              © {new Date().getFullYear()} Dance Beat Academy
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
