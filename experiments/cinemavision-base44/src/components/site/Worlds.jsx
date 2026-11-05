import { worlds, TAGLINE } from "@/components/site/worlds";
import WorldSection from "@/components/site/WorldSection";

export default function Worlds({ onEnter }) {
  return (
    <div id="worlds" className="relative z-10">
      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-10 md:pt-32" data-reveal>
        <div className="max-w-2xl">
          <span className="font-display text-[10px] tracking-[0.45em] text-primary/80">THE SIX WORLDS</span>
          <h2 className="mt-4 font-heading text-3xl font-black leading-tight tracking-tight md:text-5xl">
            شش سیاره، یک منظومه
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            از هستهٔ طلایی بیرون می‌آیند و هر کدام یک قابلیت را کامل می‌کنند. اسکرول کن تا دوربین
            از سیاره‌ای به سیارهٔ دیگر سفر کند.
          </p>
          <p dir="ltr" className="mt-4 font-display text-[10px] tracking-[0.34em] text-muted-foreground/60">
            {TAGLINE}
          </p>
        </div>
      </div>

      {worlds.map((world, index) => (
        <WorldSection key={world.id} world={world} index={index} onEnter={onEnter} />
      ))}
    </div>
  );
}