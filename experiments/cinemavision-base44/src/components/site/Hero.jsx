import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play } from "lucide-react";
import { worlds, TAGLINE } from "@/components/site/worlds";

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const opacity = useTransform(scrollYProgress, [0, 0.94], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      data-stop="0"
      className="relative flex min-h-[100svh] items-center overflow-hidden pb-16 pt-32"
    >
      <motion.div
        style={{ y, opacity }}
        className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 0.7, 0.2, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_3px_rgba(245,197,92,0.6)]" />
            <span className="font-display text-[10px] tracking-[0.3em] text-primary/90">
              AI SUPER-PLATFORM
            </span>
          </div>

          <h1 className="mt-7 font-heading text-5xl font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-[4.3rem]">
            از یک ایده،
            <br />
            <span className="bg-gradient-to-l from-primary via-[#ffe9b8] to-ember bg-clip-text text-transparent">
              یک منظومه
            </span>{" "}
            کامل.
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            SINA AI STUDIO یک هستهٔ خلاقیت است: ایده وارد می‌شود، حلقهٔ طلایی می‌شکافد و شش سیاره
            بیرون می‌آیند — بازی، وب، ویدئو، صدا، کاراکتر و جهان سه‌بعدی.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#film"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_20px_70px_-20px_rgba(245,197,92,0.85)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <Play className="h-4 w-4" />
              تماشای فیلم تبلیغاتی
            </a>
            <a
              href="#worlds"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-white/[0.08] hover:text-foreground"
            >
              ورود به شش سیاره
            </a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-x-4 gap-y-3 border-t border-white/10 pt-6 sm:grid-cols-6">
            {worlds.map((world) => (
              <a key={world.id} href={`#${world.id}`} className="group block">
                <span className="block font-display text-[9px] tracking-[0.24em] text-muted-foreground/60">
                  {world.index}
                </span>
                <span className="mt-1 flex items-center gap-1.5 font-display text-[11px] tracking-[0.16em] text-foreground/75 transition-colors group-hover:text-primary">
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: world.accent, boxShadow: `0 0 8px 2px ${world.accent}55` }}
                  />
                  {world.en}
                </span>
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.4 }}
          className="relative hidden min-h-[420px] lg:block"
        >
          <p className="absolute bottom-0 left-0 max-w-[250px] text-right">
            <span className="font-display text-[10px] tracking-[0.4em] text-primary/85">THE GOLDEN CORE</span>
            <span className="mt-2 block text-[11px] leading-relaxed text-muted-foreground">
              هستهٔ مرکزی این منظومه. حلقهٔ فلزی طلایی، نور از میان شکاف، و شش جهان که از همان نور
              متولد می‌شوند.
            </span>
          </p>
          <p
            dir="ltr"
            className="absolute right-0 bottom-0 max-w-[180px] font-display text-[9px] leading-relaxed tracking-[0.3em] text-muted-foreground/45"
          >
            {TAGLINE}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}