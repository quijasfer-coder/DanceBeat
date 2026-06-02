import type { Metadata } from "next";
import { august, inter, mono } from "./fonts";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dance Beat Academy",
    template: "%s · Dance Beat Academy",
  },
  description:
    "Academia de baile en Ciudad de México. Formación técnica, comunidad y performance. Heels, HipHop, Contemporáneo, Ritmos Latinos y más.",
  metadataBase: new URL("https://dancebeat.studio"),
  openGraph: {
    title: "Dance Beat Academy",
    description: "Formación técnica, comunidad y performance en CDMX.",
    locale: "es_MX",
    type: "website",
  },
  icons: {
    icon: "/logos/DB_black_1@300x.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={cn(august.variable, inter.variable, mono.variable, "dark")}
    >
      <body className="bg-ink text-bone font-body min-h-screen">
        {children}
      </body>
    </html>
  );
}
