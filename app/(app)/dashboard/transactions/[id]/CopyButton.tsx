"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
        copied
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-500 hover:bg-amber-400 text-white"
      }`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
