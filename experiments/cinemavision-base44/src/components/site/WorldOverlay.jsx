import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function WorldOverlay({ world, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!world) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.7, 0.2, 1] }}
      className="fixed inset-0 z-[80] overflow-y-auto bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={world.title}
    >
      <div className="relative min-h-full">
        <Image
          src={world.poster}
          alt={`پوستر ${world.title}`}
          className="absolute inset-0 h-full w-full opacity-50"
          fittingType="fill"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(70% 50% at 50% 100%, ${world.accent}22, transparent 70%)` }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="absolute left-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-24">
          <div className="flex items-center gap-3">
            <span className="font-display text-[11px] tracking-[0.34em] text-primary">{world.index}</span>
            <span className="h-px w-10 bg-gradient-to-l from-primary/70 to-transparent" />
            <span className="font-display text-[10px] tracking-[0.4em] text-white/60">{world.en}</span>
          </div>

          <h2 className="mt-5 font-heading text-5xl font-black tracking-tight md:text-7xl">{world.title}</h2>
          <p className="mt-3 font-display text-[10px] tracking-[0.34em] text-primary/80">
            {world.tagline.toUpperCase()}
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/70 md:text-lg">{world.body}</p>

          <ul className="mt-8 flex flex-wrap gap-2">
            {world.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs text-white/75"
              >
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.12]"
            >
              بازگشت به فضا
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}