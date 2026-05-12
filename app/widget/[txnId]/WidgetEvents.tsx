"use client";

import { useEffect } from "react";

export function WidgetEvents({
  transactionId,
  status,
  joined,
}: {
  transactionId: string;
  status: string;
  joined: boolean;
}) {
  useEffect(() => {
    window.parent.postMessage({ type: "safepay:ready", transactionId, status }, "*");
    if (joined) {
      window.parent.postMessage({ type: "safepay:accepted", transactionId, status }, "*");
    }
    if (status === "COMPLETED") {
      window.parent.postMessage({ type: "safepay:completed", transactionId }, "*");
    }
    if (status === "CANCELLED") {
      window.parent.postMessage({ type: "safepay:cancelled", transactionId }, "*");
    }
  }, [transactionId, status, joined]);

  return null;
}
