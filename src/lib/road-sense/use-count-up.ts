"use client";

import { useEffect, useState } from "react";

/** Animates from `from` to `to`; re-triggers whenever `to` changes. */
export function useCountUp(from: number, to: number, reducedMotion: boolean, duration = 900) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration, reducedMotion]);
  return reducedMotion ? to : value;
}
