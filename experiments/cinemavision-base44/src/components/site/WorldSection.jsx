import { ArrowLeft } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function WorldSection({ world, index, onEnter }) {
  return (
    <section
      id={world.id}
      data-stop={index + 1}
      className="relative flex min-h-[100svh] scroll-mt-0 items-end overflow-hidden border-t border-white/[0.06] pb-14 pt-24 lg:items-center lg:pb-0"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-background via-background/85 to-transparent lg:hidden" />

      <div className="relative mx-auto w-full max-w-7xl px-6">
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-3">
            <span className="font-display text-[11px] tracking-[0.34em] text-primary">{world.index}</span>
            <span className="h-px w-10 bg-gradient-to-l from-primary/70 to-transparent" />
            <span className="font-display text-[10px] tracking-[0.4em] text-muted-foreground">{world.en}</span>
          </div>

          <h2 className="mt-5 font-heading text-5xl font-black leading-[1.04] tracking-tight md:text-7xl">
            {world.title}
          </h2>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            {world.body}
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {world.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-foreground/70"
              >
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onEnter(world)}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_20px_70px_-24px_rgba(245,197,92,0.85)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              ورود به جهان
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => onEnter(world)}
              className="group relative overflow-hidden rounded-xl border border-white/10"
              aria-label={`پوستر ${world.title}`}
            >
              <Image
                src={world.poster}
                alt={`پوستر سیارهٔ ${world.title}`}
                className="h-[92px] w-[150px]"
                fittingType="fill"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-1 text-center font-display text-[8px] tracking-[0.3em] text-white/75">
                POSTER
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}