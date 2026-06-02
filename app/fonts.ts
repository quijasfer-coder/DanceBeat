import localFont from "next/font/local";
import { Inter, JetBrains_Mono } from "next/font/google";

export const august = localFont({
  src: "../public/fonts/August-Bold.ttf",
  variable: "--font-august",
  display: "swap",
  weight: "700",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
