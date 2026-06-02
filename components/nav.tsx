"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/clases", label: "Clases" },
  { href: "/horarios", label: "Horarios" },
  { href: "/planes", label: "Planes" },
  { href: "/luminaria", label: "Luminaria" },
  { href: "/impulse", label: "Impulse" },
  { href: "/academy", label: "Academy" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-ink/80 backdrop-blur-xl border-b border-bone-border/30"
          : "bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Inicio">
          <Image
            src="/logos/DB_white_1@300x.png"
            alt="Dance Beat Academy"
            width={28}
            height={32}
            priority
          />
          <span className="font-display text-lg leading-none">
            Dance Beat
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-bone-mute hover:text-bone transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/auth/login"
          className="text-sm border border-bone-border/60 hover:border-bone hover:bg-bone hover:text-ink transition-all px-4 py-2 rounded-full"
        >
          Iniciar sesión
        </Link>
      </div>
    </header>
  );
}
