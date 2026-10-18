import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clampProgress } from "./progress";

gsap.registerPlugin(ScrollTrigger);

interface ScrollControllerProps {
  onProgress: (progress: number) => void;
}

/** Owns the single page-level ScrollTrigger that drives the universe timeline. */
export default function ScrollController({ onProgress }: ScrollControllerProps) {
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      onProgressRef.current(1);
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "+=3000",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => onProgressRef.current(clampProgress(self.progress)),
    });

    return () => {
      // Kill only the trigger owned by this component; do not affect other page features.
      trigger.kill();
    };
  }, []);

  return null;
}
