import VisualShell from "@/components/site/visuals/VisualShell";

const tiles = [
  "bg-[conic-gradient(from_210deg_at_50%_60%,#081018,#35E0FF_38%,#0b1220_72%,#8B5CF6)]",
  "bg-[radial-gradient(80%_80%_at_30%_20%,#8B5CF6,#080b14_72%)]",
  "bg-[linear-gradient(150deg,#0d2230,#35E0FF_60%,#081018)]",
  "bg-[radial-gradient(70%_70%_at_70%_30%,#E8B96A,#080b14_70%)]",
  "bg-[conic-gradient(from_40deg_at_50%_50%,#0a1018,#8B5CF6_45%,#081018_80%,#35E0FF)]",
  "bg-[linear-gradient(210deg,#081018,#1a2740_55%,#35E0FF)]",
];

export default function ImageGrid() {
  return (
    <VisualShell>
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-2 p-4 sm:gap-3 sm:p-5" aria-hidden="true">
        {tiles.map((tile, index) => (
          <div
            key={index}
            className={`group relative overflow-hidden rounded-xl border border-white/10 ${tile} opacity-80 transition-all duration-700 hover:scale-[1.04] hover:opacity-100`}
          >
            {index === 1 && (
              <span className="absolute inset-x-0 top-0 h-8 anim-scan bg-gradient-to-b from-transparent via-white/35 to-transparent" />
            )}
          </div>
        ))}
      </div>
      <p className="absolute bottom-5 right-6 font-display text-[10px] tracking-[0.4em] text-white/35">IMAGE · 03</p>
    </VisualShell>
  );
}