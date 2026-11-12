import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";

const LINKS = [
  { href: "#film", label: "فیلم تبلیغاتی" },
  { href: "#worlds", label: "شش جهان" },
  { href: "#start", label: "شروع" },
];

export default function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? "border-b border-border/60 bg-background/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="absolute inset-x-0 top-0 h-px origin-right bg-gradient-to-l from-primary via-white/50 to-ember"
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="flex items-center gap-3">
          <span className="relative grid h-9 w-9 place-items-center rounded-full border border-primary/40">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_4px_rgba(53,224,255,0.55)]" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[12px] font-semibold tracking-[0.26em] text-foreground">
              SINA AI STUDIO
            </span>
            <span className="block text-[10px] text-muted-foreground">استودیوی خلاقیت هوشمند</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#worlds"
          className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-[11px] font-medium text-primary md:hidden"
        >
          جهان‌ها
        </a>
        <a
          href="#film"
          className="hidden items-center gap-2 rounded-full border border-border/80 bg-white/[0.03] px-4 py-2 text-xs text-foreground/80 transition-colors hover:bg-white/[0.07] md:inline-flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_10px_3px_rgba(139,92,246,0.5)]" />
          تماشای فیلم
        </a>
      </div>
      <div className="h-px w-full bg-gradient-to-l from-transparent via-border/60 to-transparent" />
    </header>
  );
}