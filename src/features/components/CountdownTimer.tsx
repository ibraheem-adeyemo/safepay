import { useEffect, useState } from "react";

export function CountdownTimer() {
  const [t, setT] = useState({ h: 11, m: 43, s: 7 });
  useEffect(() => {
    const id = setInterval(() => setT((p) => {
      let { h, m, s } = p; s--;
      if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) h = 0;
      return { h, m, s };
    }), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return <span className="font-mono font-bold text-amber-300">{pad(t.h)}:{pad(t.m)}:{pad(t.s)}</span>;
}