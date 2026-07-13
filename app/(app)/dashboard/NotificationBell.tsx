"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const POLL_INTERVAL = 30_000; // 30 seconds

export default function NotificationBell({
  initialCount,
}: {
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [toast, setToast] = useState<string | null>(null);
  const prevCount = useRef(initialCount);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/notifications/unread", { cache: "no-store" });
        if (!res.ok) return;
        const { count: fresh } = await res.json();

        setCount(fresh);

        // Show a toast only when new notifications have arrived since last poll
        if (fresh > prevCount.current) {
          const diff = fresh - prevCount.current;
          showToast(
            diff === 1
              ? "You have 1 new notification"
              : `You have ${diff} new notifications`
          );
        }
        prevCount.current = fresh;
      } catch {
        // Network hiccup — silently skip this tick
      }
    }

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  return (
    <>
      {/* Nav link with live badge */}
      <Link
        href="/dashboard/notifications"
        className="hover:text-stone-900 transition-colors relative"
      >
        Notifications
        {count > 0 && (
          <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>

      {/* Slide-in toast */}
      {toast && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-stone-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg animate-slide-in"
        >
          <span className="text-base">🔔</span>
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-stone-400 hover:text-white transition-colors text-xs"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
