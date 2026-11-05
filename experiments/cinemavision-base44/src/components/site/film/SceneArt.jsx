export default function SceneArt({ index }) {
  if (index === 0) {
    return (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_55%,rgba(53,224,255,0.35),transparent_72%)] anim-glow" />
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_90px_32px_rgba(53,224,255,0.55)]" />
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 anim-spin-slow [animation-duration:40s]" />
      </>
    );
  }

  if (index === 1) {
    return (
      <div className="absolute inset-0 grid grid-cols-3 gap-px p-6 md:gap-2 md:p-10">
        {[
          "bg-[linear-gradient(160deg,rgba(53,224,255,0.18),transparent_70%)]",
          "bg-[linear-gradient(200deg,rgba(139,92,246,0.18),transparent_70%)]",
          "bg-[linear-gradient(120deg,rgba(255,255,255,0.10),transparent_70%)]",
        ].map((tone, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-xl border border-white/10 ${tone}`}
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            <div className="absolute inset-x-3 bottom-4 space-y-2">
              <div className="h-1.5 w-2/3 rounded-full bg-white/25" />
              <div className="h-1.5 w-1/2 rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="absolute inset-x-6 bottom-16 flex h-28 items-end justify-between gap-1 md:inset-x-12 md:h-36">
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="w-full rounded-full bg-gradient-to-t from-primary/20 to-primary/80 anim-wave"
            style={{ height: `${25 + ((i * 53) % 75)}%`, animationDelay: `${(i % 12) * 0.09}s` }}
          />
        ))}
      </div>
    );
  }

  if (index === 3) {
    return (
      <div className="absolute inset-0 [perspective:900px]">
        <div className="absolute inset-x-0 bottom-0 h-2/3 origin-bottom [transform:rotateX(66deg)] bg-[linear-gradient(to_right,rgba(53,224,255,0.16)_1px,transparent_1px),linear-gradient(to_top,rgba(53,224,255,0.16)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_top,black,transparent)]" />
        <div className="absolute left-1/2 top-[38%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] anim-cube md:h-24 md:w-24">
          {[
            "translateZ(40px)",
            "rotateY(180deg) translateZ(40px)",
            "rotateY(90deg) translateZ(40px)",
            "rotateY(-90deg) translateZ(40px)",
            "rotateX(90deg) translateZ(40px)",
            "rotateX(-90deg) translateZ(40px)",
          ].map((transform) => (
            <div
              key={transform}
              style={{ transform }}
              className="absolute inset-0 border border-primary/45 bg-primary/[0.06]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-white/12 bg-[#070a12]/90 shadow-[0_40px_120px_-40px_rgba(53,224,255,0.5)]">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
        </div>
        <div className="space-y-3 p-4">
          <div className="h-2.5 w-2/3 rounded bg-white/25" />
          <div className="h-1.5 w-full rounded bg-white/10" />
          <div className="h-1.5 w-4/5 rounded bg-white/10" />
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="h-12 rounded-lg bg-[linear-gradient(150deg,rgba(53,224,255,0.35),transparent)]" />
            <div className="h-12 rounded-lg bg-[linear-gradient(150deg,rgba(139,92,246,0.35),transparent)]" />
            <div className="h-12 rounded-lg bg-white/[0.06]" />
          </div>
          <div className="h-6 w-24 rounded-full bg-primary/80" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_80%,rgba(53,224,255,0.18),transparent_70%)]" />
    </div>
  );
}