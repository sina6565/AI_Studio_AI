import { useCallback, useState } from "react";
import { clampProgress } from "./progress";

export function useUniverseProgress() {
  const [progress, setProgress] = useState(0);
  const updateProgress = useCallback((nextProgress: number) => {
    setProgress(clampProgress(nextProgress));
  }, []);

  return { progress, updateProgress };
}
