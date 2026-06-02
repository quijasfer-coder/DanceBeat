import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100svh] flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
      {/* Spotlight Lumen sutil */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(184,164,255,0.1), rgba(0,0,0,0) 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="flex justify-center mb-12"
          aria-label="Inicio"
        >
          <Image
            src="/logos/DB_white_1@300x.png"
            alt="Dance Beat Academy"
            width={48}
            height={56}
          />
        </Link>

        {children}
      </div>
    </div>
  );
}
