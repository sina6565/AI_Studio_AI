import VisualShell from "@/components/site/visuals/VisualShell";

export default function IdeaCore() {
  return (
    <VisualShell>
      <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
        <div className="relative h-[64%] w-[64%]">
          <div className="absolute inset-0 rounded-full border border-primary/25 anim-spin-slow" />
          <div className="absolute inset-[12%] rounded-full border border-ember/30 anim-spin-slow [animation-duration:38s] [animation-direction:reverse]" />
          <div className="absolute inset-[26%] rounded-full border border-white/10" />
          <div className="absolute inset-[38%] rounded-full bg-primary/60 blur-[2px] anim-glow shadow-[0_0_90px_24px_rgba(53,224,255,0.22)]" />
          <div className="absolute inset-[41%] rounded-full bg-white/85 blur-[10px] anim-glow" />
        </div>
      </div>
      <span className="absolute left-[20%] top-[24%] h-2 w-2 rounded-full bg-ember shadow-[0_0_18px_5px_rgba(139,92,246,0.5)] anim-float" />
      <span className="absolute bottom-[22%] right-[24%] h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_16px_4px_rgba(53,224,255,0.5)] anim-float [animation-delay:1.4s]" />
      <p className="absolute bottom-5 right-6 font-display text-[10px] tracking-[0.4em] text-white/35">IDEA · 01</p>
    </VisualShell>
  );
}