import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-ink">
      {/* Background — desktop · oscurecido al 80% por overlay encima */}
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover hidden md:block"
      />
      {/* Background — mobile */}
      <Image
        src="/images/hero-mobile.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover md:hidden"
      />

      {/* Overlay oscuro al 80% — la foto queda al 20% visible */}
      <div aria-hidden className="absolute inset-0 bg-ink/80 pointer-events-none" />

      {/* Gradiente inferior — fusiona la foto con el ink sólido de la página */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,1) 100%)",
        }}
      />

      {/* Logo centrado */}
      <div className="relative z-10 min-h-[100svh] flex items-center justify-center px-6">
        <Image
          src="/logos/DB_white@300x.png"
          alt="Dance Beat Academy"
          width={1200}
          height={430}
          priority
          className="w-full max-w-md md:max-w-xl lg:max-w-2xl h-auto animate-fade-up"
        />
      </div>
    </section>
  );
}
