"use client";
// Solo desarrollo (lo monta layout.tsx con NODE_ENV === "development"): pone ?data=… en la URL actual.
// Recarga la página entera, así que el modo vive en la URL y sobrevive a un reload.
import { useSyncExternalStore } from "react";

const SEGMENTS = [["", "Off"], ["demo", "Demo"], ["worst", "Worst case"], ["empty", "Empty"], ["one", "One"], ["huge", "1,000"]];

export function DataToggle() {
  const href = useSyncExternalStore(() => () => {}, () => location.href, () => null);
  if (!href) return null;
  const url = new URL(href);
  const active = url.searchParams.get("data") ?? "";
  return (
    <nav
      aria-label="Datos de prueba"
      style={{
        position: "fixed", bottom: 12, left: 8, right: 8, width: "fit-content", margin: "0 auto", zIndex: 2147483647,
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 2, padding: 3,
        borderRadius: 999, background: "#e4e4e7", font: "12px/1.2 system-ui, sans-serif",
      }}
    >
      {SEGMENTS.map(([value, label]) => {
        const u = new URL(url);
        if (value) u.searchParams.set("data", value);
        else u.searchParams.delete("data");
        const on = value === active;
        return (
          <a
            key={value}
            href={u.pathname + u.search}
            aria-current={on || undefined}
            style={{
              padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap", textDecoration: "none", color: "#18181b",
              background: on ? "#fff" : "transparent", boxShadow: on ? "0 1px 2px #0003" : "none",
            }}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
