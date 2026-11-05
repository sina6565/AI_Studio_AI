import VisualShell from "@/components/site/visuals/VisualShell";

const FACES = [
  "translateZ(46px)",
  "rotateY(180deg) translateZ(46px)",
  "rotateY(90deg) translateZ(46px)",
  "rotateY(-90deg) translateZ(46px)",
  "rotateX(90deg) translateZ(46px)",
  "rotateX(-90deg) translateZ(46px)",
];

const PIXELS = [0, 4, 6, 7, 8, 12, 16, 18, 19, 21, 23];

export default function DimensionScene() {
  return (
    <VisualShell>
      <div className="absolute inset-0 [perspective:900px]" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-0 h-3/5 origin-bottom [transform:rotateX(68deg)] bg-[linear-gradient(to_right,rgba(53,224,255,0.16)_1px,transparent_1px),linear-gradient(to_top,rgba(53,224,255,0.16)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:linear-gradient(to_top,black,transparent)]" />
        <div className="absolute left-[46%] top-[42%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] anim-cube">
          {FACES.map((transform) => (
            <div
              key={transform}
              style={{ transform }}
              className="absolute inset-0 border border-primary/45 bg-primary/[0.06]"
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-6 grid grid-cols-5 gap-1 rounded-xl border border-white/10 bg-black/50 p-2" aria-hidden="true">
        {Array.from({ length: 25 }).map((_, index) => (
          <span
            key={index}
            className={`h-2 w-2 rounded-[2px] ${
              PIXELS.includes(index) ? "bg-ember shadow-[0_0_8px_2px_rgba(139,92,246,0.5)]" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <p className="absolute bottom-6 right-6 font-display text-[10px] tracking-[0.4em] text-white/35">3D · GAME</p>
    </VisualShell>
  );
}