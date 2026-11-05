import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Atmosphere from "@/components/site/Atmosphere";
import PlanetScene from "@/components/site/PlanetScene";
import SiteHeader from "@/components/site/SiteHeader";
import Hero from "@/components/site/Hero";
import PromoFilm from "@/components/site/PromoFilm";
import Worlds from "@/components/site/Worlds";
import WorldOverlay from "@/components/site/WorldOverlay";
import Outro from "@/components/site/Outro";
import useReveal from "@/hooks/useReveal";

export default function Home() {
  useReveal();
  const [activeWorld, setActiveWorld] = useState(null);
  const closeWorld = useCallback(() => setActiveWorld(null), []);

  return (
    <div
      dir="rtl"
      lang="fa"
      className="relative min-h-screen overflow-x-hidden bg-background font-body text-foreground"
    >
      <PlanetScene />
      <Atmosphere />
      <SiteHeader />
      <main className="relative z-10">
        <Hero />
        <PromoFilm />
        <Worlds onEnter={setActiveWorld} />
        <Outro />
      </main>

      <AnimatePresence>
        {activeWorld && <WorldOverlay world={activeWorld} onClose={closeWorld} />}
      </AnimatePresence>
    </div>
  );
}