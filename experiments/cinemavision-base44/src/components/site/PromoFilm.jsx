import { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { Pause, Play, RotateCcw } from "lucide-react";
import TrailerStage from "@/lib/planets/TrailerStage";
import { detectQuality } from "@/lib/planets/quality";
import { PHASES, TRAILER_DURATION, formatTime, phaseAt, sampleTrailer } from "@/lib/planets/trailer";
import { setBackgroundActive } from "@/lib/renderGate";
import { KEY_ART, TAGLINE } from "@/components/site/worlds";

const INITIAL_UI = { pct: 0, phase: "space" };

export default function PromoFilm() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const logoRef = useRef(null);
  const taglineRef = useRef(null);
  const clockRef = useRef(0);
  const playingRef = useRef(false);
  const uiRef = useRef({ ...INITIAL_UI });

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ui, setUi] = useState(INITIAL_UI);

  const setPlay = useCallback((next) => {
    playingRef.current = next;
    setPlaying(next);
    setBackgroundActive(!next);
  }, []);

  const toggle = useCallback(() => {
    if (!started) {
      setStarted(true);
      setPlay(true);
      return;
    }
    setPlay(!playingRef.current);
  }, [setPlay, started]);

  const restart = useCallback(() => {
    clockRef.current = 0;
    setPlay(true);
  }, [setPlay]);

  // Start once the film is on screen, and rest when it leaves.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0.45 && !playingRef.current) setPlay(true);
        if (entry.intersectionRatio < 0.15 && playingRef.current) setPlay(false);
      },
      { threshold: [0.15, 0.45] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [setPlay]);

  useEffect(() => {
    if (!started || !canvasRef.current) return;

    let stage;
    try {
      stage = new TrailerStage(canvasRef.current, { quality: detectQuality() });
    } catch (error) {
      console.error("Trailer could not start", error);
      setFailed(true);
      setStarted(false);
      return;
    }

    let raf = 0;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (playingRef.current) {
        clockRef.current += dt;
        if (clockRef.current >= TRAILER_DURATION) {
          clockRef.current = 0;
        }
      }

      const time = clockRef.current;
      const frame = sampleTrailer(time);

      try {
        stage.setTime(time);
        stage.render();
      } catch (error) {
        console.error("Trailer stopped", error);
        setFailed(true);
        setPlay(false);
        return;
      }

      if (logoRef.current) {
        logoRef.current.style.opacity = String(frame.logo);
        logoRef.current.style.transform = `perspective(1100px) rotateX(${(1 - frame.logo) * 14}deg) scale(${0.92 + frame.logo * 0.08})`;
      }
      if (taglineRef.current) {
        taglineRef.current.style.opacity = String(frame.tagline);
      }

      const pct = (time / TRAILER_DURATION) * 100;
      const phase = phaseAt(time).key;
      if (Math.abs(pct - uiRef.current.pct) > 0.5 || phase !== uiRef.current.phase) {
        uiRef.current = { pct, phase };
        setUi({ pct, phase });
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    const onResize = () => stage.resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      stage.dispose();
      setBackgroundActive(true);
    };
  }, [started, setPlay]);

  const seek = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    clockRef.current = ratio * TRAILER_DURATION;
    if (!playingRef.current) setPlay(true);
  };

  const currentPhase = PHASES.find((phase) => phase.key === ui.phase) ?? PHASES[0];
  const seconds = (ui.pct / 100) * TRAILER_DURATION;

  return (
    <section ref={sectionRef} id="film" data-stop="0" className="relative z-10 border-t border-white/[0.06] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between" data-reveal>
          <div>
            <span className="font-display text-[10px] tracking-[0.45em] text-primary/80">PROMO FILM</span>
            <h2 className="mt-4 font-heading text-3xl font-black tracking-tight md:text-5xl">فیلم تبلیغاتی</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            یک سکانس پیوستهٔ سه‌بعدی: شکافتن زحل، تولد هستهٔ طلایی، آشکار شدن لوگو و زاده شدن شش
            سیاره. بدون کلیپ آماده — رندر زنده در مرورگر.
          </p>
        </div>

        <div
          className="relative mt-10 overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_70px_200px_-70px_rgba(245,197,92,0.5)]"
          data-reveal
        >
          <div className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[16/9]">
            <Image
              src={KEY_ART}
              alt="پوستر فیلم تبلیغاتی سینا"
              className="absolute inset-0 h-full w-full"
              fittingType="fill"
            />

            {started && (
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            )}

            {!started && (
              <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_45%,rgba(0,0,0,0.15),rgba(0,0,0,0.75))]" />
            )}

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_45%,rgba(0,0,0,0.72))]" />

            {!started && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center">
                <span className="font-display text-[9px] tracking-[0.5em] text-white/50">A CINEMATIC SEQUENCE</span>
                <div className="relative">
                  <span className="absolute inset-0 -m-6 rounded-full bg-primary/20 blur-3xl" />
                  <span className="relative block bg-gradient-to-b from-[#fff8e4] via-[#f4c96b] to-[#a9741f] bg-clip-text font-display text-2xl font-black tracking-[0.2em] text-transparent sm:text-3xl md:text-5xl">
                    SINA AI STUDIO
                  </span>
                </div>
                <p className="max-w-sm px-6 text-[11px] leading-relaxed text-white/55">
                  {TAGLINE}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStarted(true);
                    setPlay(true);
                  }}
                  className="mt-1 grid h-16 w-16 place-items-center rounded-full border border-primary/40 bg-black/40 text-primary backdrop-blur-md transition-transform duration-300 hover:scale-105"
                  aria-label="پخش فیلم"
                >
                  <Play className="h-5 w-5" />
                </button>
              </div>
            )}

            {started && (
              <>
                <div
                  ref={logoRef}
                  style={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center will-change-transform"
                >
                  <span className="absolute h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,224,150,0.55),transparent_70%)] blur-2xl md:h-64 md:w-64" />
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 translate-x-[3px] translate-y-[4px] font-display text-2xl font-black tracking-[0.2em] text-[#42280a] sm:text-3xl md:text-6xl"
                    >
                      SINA AI STUDIO
                    </span>
                    <span className="relative block bg-gradient-to-b from-[#fffdf2] via-[#f7d07a] to-[#bb7f28] bg-clip-text font-display text-2xl font-black tracking-[0.2em] text-transparent drop-shadow-[0_0_28px_rgba(255,206,120,0.5)] sm:text-3xl md:text-6xl">
                      SINA AI STUDIO
                    </span>
                  </div>
                  <span className="mt-4 block font-display text-[8px] tracking-[0.5em] text-white/55 md:text-[10px]">
                    AI SUPER-PLATFORM
                  </span>
                </div>

                <div
                  ref={taglineRef}
                  style={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-x-0 bottom-14 px-6 text-center md:bottom-20"
                >
                  <p className="font-display text-[10px] font-semibold leading-relaxed tracking-[0.28em] text-white/85 md:text-sm md:tracking-[0.42em]">
                    {TAGLINE}
                  </p>
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 md:p-6">
                  <span className="font-display text-[9px] tracking-[0.4em] text-white/45">
                    {currentPhase.en}
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 font-display text-[9px] tracking-[0.3em] text-white/60 backdrop-blur">
                    {currentPhase.label}
                  </span>
                </div>
              </>
            )}

            {failed && (
              <div className="absolute inset-x-0 bottom-24 mx-auto w-fit rounded-full border border-white/15 bg-black/70 px-4 py-2 text-[11px] text-white/70">
                رندر سه‌بعدی در این مرورگر اجرا نشد.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 bg-black/80 p-4 md:flex-row md:items-center md:gap-6 md:p-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "توقف" : "پخش"}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white transition-colors hover:bg-white/[0.12]"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={restart}
                aria-label="پخش از ابتدا"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <span dir="ltr" className="font-display text-[11px] tracking-[0.2em] text-white/50">
                {formatTime(seconds)} / {formatTime(TRAILER_DURATION)}
              </span>
            </div>

            <div className="flex-1">
              <button
                type="button"
                onClick={seek}
                aria-label="جابه‌جایی در فیلم"
                className="group relative block h-6 w-full"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full origin-right bg-gradient-to-l from-primary to-ember transition-[width] duration-150"
                    style={{ width: `${ui.pct}%` }}
                  />
                </span>
                {PHASES.filter((phase) => phase.key !== "space").map((phase) => (
                  <span
                    key={phase.key}
                    className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/25"
                    style={{ left: `${(phase.from / TRAILER_DURATION) * 100}%` }}
                  />
                ))}
              </button>
              <div className="mt-1 flex justify-between font-display text-[8px] tracking-[0.24em] text-white/30">
                {PHASES.map((phase) => (
                  <span key={phase.key} className={phase.key === ui.phase ? "text-primary/80" : undefined}>
                    {phase.en}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}