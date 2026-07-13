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
    window.parent.postMessage({ type: "vaultlify:ready", transactionId, status }, "*");
    if (joined) {
      window.parent.postMessage({ type: "vaultlify:accepted", transactionId, status }, "*");
    }
    if (status === "COMPLETED") {
      window.parent.postMessage({ type: "vaultlify:completed", transactionId }, "*");
    }
    if (status === "CANCELLED") {
      window.parent.postMessage({ type: "vaultlify:cancelled", transactionId }, "*");
    }
  }, [transactionId, status, joined]);

  return null;
}
