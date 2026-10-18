import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clampProgress } from "./progress";

gsap.registerPlugin(ScrollTrigger);

interface ScrollControllerProps {
  onProgress: (progress: number) => void;
}

/** Single page-level ScrollTrigger; owns and cleans up only its own resources. */
export default function ScrollController({ onProgress }: ScrollControllerProps) {
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setReducedMotionProgress = () => {
      // Keep the full composition visible without attaching a scroll-driven animation.
      onProgressRef.current(motionPreference.matches ? 1 : 0);
    };

    if (motionPreference.matches) {
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

    motionPreference.addEventListener?.("change", setReducedMotionProgress);
    return () => {
      motionPreference.removeEventListener?.("change", setReducedMotionProgress);
      trigger.kill();
    };
  }, []);

  return null;
}
