"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (window as any).workbox === undefined
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registrado con éxito:", reg.scope);
        })
        .catch((err) => {
          console.error("Error al registrar el Service Worker:", err);
        });
    }
  }, []);

  return null;
}
