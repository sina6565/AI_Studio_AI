import VisualShell from "@/components/site/visuals/VisualShell";

export default function WebScene() {
  return (
    <VisualShell>
      <div className="absolute inset-4 overflow-hidden rounded-2xl border border-white/12 bg-[#070a12]/90 sm:inset-6" aria-hidden="true">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
          <span className="mr-2 h-1.5 flex-1 rounded-full bg-white/[0.06]" />
        </div>
        <div className="space-y-2.5 p-4">
          <div className="h-2.5 w-3/5 rounded bg-white/25" />
          <div className="h-1.5 w-full rounded bg-white/10" />
          <div className="h-1.5 w-4/5 rounded bg-white/10" />
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="h-14 rounded-lg bg-[linear-gradient(150deg,rgba(53,224,255,0.35),transparent)]" />
            <div className="h-14 rounded-lg bg-[linear-gradient(150deg,rgba(139,92,246,0.35),transparent)]" />
            <div className="h-14 rounded-lg bg-white/[0.05]" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-6 w-20 rounded-full bg-primary/80" />
            <div className="h-6 w-16 rounded-full border border-white/15" />
          </div>
        </div>
      </div>

      <div
        className="absolute -bottom-2 left-5 h-32 w-16 rounded-2xl border border-white/15 bg-[#080b14] p-1.5 shadow-[0_30px_60px_-20px_rgba(53,224,255,0.4)] anim-float sm:left-8"
        aria-hidden="true"
      >
        <div className="mx-auto mb-1.5 h-1 w-5 rounded-full bg-white/25" />
        <div className="space-y-1.5">
          <div className="h-1.5 w-3/4 rounded bg-white/25" />
          <div className="h-1 w-full rounded bg-white/10" />
          <div className="h-5 rounded bg-[linear-gradient(150deg,rgba(53,224,255,0.4),transparent)]" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
      </div>

      <p className="absolute bottom-5 right-6 font-display text-[10px] tracking-[0.4em] text-white/35">WEB · 06</p>
    </VisualShell>
  );
}