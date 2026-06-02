import { Hero } from "@/components/home/hero";
import { StylesGrid } from "@/components/home/styles-grid";
import { PlansPreview } from "@/components/home/plans-preview";
import { LuminariaCta } from "@/components/home/luminaria-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StylesGrid />
      <PlansPreview />
      <LuminariaCta />
    </>
  );
}
