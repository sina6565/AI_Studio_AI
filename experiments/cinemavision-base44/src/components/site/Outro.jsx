import { ArrowLeft } from "lucide-react";
import { TAGLINE, worlds } from "@/components/site/worlds";

export default function Outro() {
  return (
    <section
      id="start"
      data-stop="6"
      className="relative z-10 scroll-mt-20 overflow-hidden border-t border-white/[0.06]"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-48 h-96 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(245,197,92,0.18),transparent_70%)]" />

      <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32" data-reveal>
        <span className="font-display text-[10px] tracking-[0.45em] text-primary/80">SINA AI STUDIO</span>
        <h2 className="mt-6 font-heading text-4xl font-black leading-tight tracking-tight md:text-6xl">
          جهان بعدی را تو می‌سازی.
        </h2>

        <p
          dir="ltr"
          className="mx-auto mt-8 max-w-2xl font-display text-[11px] font-semibold leading-relaxed tracking-[0.3em] text-primary/85 md:text-sm md:tracking-[0.38em]"
        >
          {TAGLINE}
        </p>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          از یک ایده شروع کن؛ شش سیاره مسیر را ادامه می‌دهند: {worlds.map((world) => world.title).join("، ")}.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#film"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_20px_70px_-20px_rgba(245,197,92,0.85)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            تماشای فیلم
            <ArrowLeft className="h-4 w-4" />
          </a>
          <a
            href="#worlds"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            مرور شش سیاره
          </a>
        </div>
      </div>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span className="font-display tracking-[0.3em] text-foreground/70">SINA · AI STUDIO</span>
          <span>هستهٔ طلایی — از ایده تا منظومه</span>
          <span className="font-display tracking-[0.25em]">۱۴۰۴</span>
        </div>
      </footer>
    </section>
  );
}