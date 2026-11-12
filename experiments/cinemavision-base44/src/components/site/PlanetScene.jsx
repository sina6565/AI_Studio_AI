import { useEffect, useRef, useState } from "react";
import UniverseStage, { detectQuality } from "@/lib/planets/UniverseStage";
import { isBackgroundActive } from "@/lib/renderGate";

export default function PlanetScene() {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let stage;
    try {
      stage = new UniverseStage(canvas, {
        quality: detectQuality(),
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    } catch (error) {
      console.error("3D universe could not start", error);
      setFailed(true);
      return;
    }

    const measure = () => {
      const sections = Array.from(document.querySelectorAll("[data-stop]"))
        .map((node) => {
          const rect = node.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          return {
            stop: Number(node.dataset.stop),
            y: top + rect.height / 2 - window.innerHeight / 2,
          };
        })
        .sort((a, b) => a.y - b.y);
      stage.setSections(sections);
    };

    measure();
    const settle = requestAnimationFrame(measure);

    let raf = 0;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (isBackgroundActive()) {
        try {
          stage.update(dt);
        } catch (error) {
          console.error("3D universe stopped", error);
          setFailed(true);
          return;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onScroll = () => stage.updateScroll();
    const onPointer = (event) =>
      stage.setPointer(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1
      );
    const onResize = () => {
      stage.resize();
      measure();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);

    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(settle);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      stage.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 h-full w-full transition-opacity duration-1000 ${
          failed ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_left,rgba(4,5,10,0.9),rgba(4,5,10,0.52)_42%,rgba(4,5,10,0.05)_76%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(125%_105%_at_50%_50%,transparent_40%,rgba(3,4,8,0.78))]"
      />
    </>
  );
}