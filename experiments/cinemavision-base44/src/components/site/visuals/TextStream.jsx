import VisualShell from "@/components/site/visuals/VisualShell";

const rows = [
  { width: "86%", tone: "from-white/30" },
  { width: "64%", tone: "from-primary/60" },
  { width: "74%", tone: "from-white/20" },
  { width: "48%", tone: "from-white/15" },
  { width: "68%", tone: "from-ember/50" },
  { width: "36%", tone: "from-white/10" },
];

export default function TextStream() {
  return (
    <VisualShell>
      <div className="absolute inset-0 flex flex-col justify-center gap-3 px-8" aria-hidden="true">
        {rows.map((row, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-full bg-white/[0.04]"
            style={{ width: row.width }}
          >
            <div className={`h-2 w-full bg-gradient-to-l ${row.tone} to-transparent`} />
            <div className="absolute inset-0 anim-sheen bg-gradient-to-l from-transparent via-primary/40 to-transparent" />
          </div>
        ))}
      </div>
      <div className="absolute bottom-5 right-6 flex items-center gap-2 font-display text-[10px] tracking-[0.4em] text-white/35">
        TEXT
        <span className="h-3 w-px bg-white/20" />
        <span className="h-3 w-[2px] bg-primary anim-glow" />
      </div>
    </VisualShell>
  );
}