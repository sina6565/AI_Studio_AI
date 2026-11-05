import { Play } from "lucide-react";
import VisualShell from "@/components/site/visuals/VisualShell";

const BAR_COUNT = 40;

export default function MotionWave() {
  return (
    <VisualShell>
      <div className="absolute inset-0 flex flex-col justify-between p-6" aria-hidden="true">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <Play className="h-3.5 w-3.5" />
          </span>
          <div className="flex-1">
            <div className="h-1.5 w-24 rounded-full bg-white/20" />
            <div className="mt-2 h-1 w-14 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="flex h-24 items-center justify-between gap-[3px] px-1 sm:h-32">
          {Array.from({ length: BAR_COUNT }).map((_, index) => (
            <span
              key={index}
              className="w-full rounded-full bg-gradient-to-t from-primary/15 via-primary/60 to-ember/80 anim-wave"
              style={{ height: `${22 + ((index * 47) % 78)}%`, animationDelay: `${(index % 14) * 0.07}s` }}
            />
          ))}
        </div>

        <div className="space-y-2">
          <div className="relative h-[3px] w-full rounded-full bg-white/10">
            <span className="absolute inset-y-0 right-0 w-2/5 rounded-full bg-gradient-to-l from-primary to-ember" />
            <span className="absolute -top-[3px] right-[40%] h-[9px] w-[9px] rounded-full bg-white shadow-[0_0_14px_4px_rgba(53,224,255,0.6)]" />
          </div>
          <div className="flex justify-between font-display text-[9px] tracking-[0.3em] text-white/30">
            <span>VIDEO</span>
            <span>VOICE</span>
            <span>MUSIC</span>
            <span>MIX</span>
          </div>
        </div>
      </div>
    </VisualShell>
  );
}