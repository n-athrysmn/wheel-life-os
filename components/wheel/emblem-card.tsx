import type { CSSProperties } from "react";
import type { FirebaseRecord } from "@/components/helpers/interface";
import { emblemTheme, type EmblemStatus } from "../helpers/emblem-state";
import { Badge, Card } from "./ui";

export function EmblemCard({
  emblem,
  resolvedStatus,
}: {
  emblem: FirebaseRecord;
  resolvedStatus: EmblemStatus;
}) {
  const color = emblemTheme(emblem.theme);
  const acquiredAt = emblem.acquiredAt
    ? new Date(String(emblem.acquiredAt))
    : null;
  const acquiredDate =
    acquiredAt && Number.isFinite(acquiredAt.getTime())
      ? new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(acquiredAt)
      : "Not acquired";
  return (
    <Card
      style={{ borderColor: color, "--emblem-color": color } as CSSProperties}
      className={`group flex flex-col items-center rounded-2xl border bg-linear-to-b from-[#1A2433] via-[#141D2A] to-[#0F1622] p-5 text-center shadow-md transition-shadow duration-200 hover:shadow-[0_12px_28px_-4px_color-mix(in_srgb,var(--emblem-color)_45%,transparent),0_0_14px_color-mix(in_srgb,var(--emblem-color)_25%,transparent)] motion-reduce:transition-none ${resolvedStatus === "locked" ? "opacity-70" : ""} ${resolvedStatus === "forging" ? "border-dashed" : resolvedStatus === "locked" ? "border-dotted" : "border-solid"}`}
    >
      <div
        aria-hidden='true'
        style={{
          borderColor: color,
          color,
          boxShadow: `0 8px 22px ${color}45, inset 0 1px 0 rgb(255 255 255 / .12)`,
        }}
        className='relative mb-3.5 flex h-16 w-16 items-center justify-center rounded-xl border-2 bg-linear-to-b from-[#243144] to-[#16202D] text-3xl transition-[border-radius,box-shadow] duration-200 group-hover:scale-110'
      >
        {String(emblem.icon || (resolvedStatus === "unlocked" ? "✦" : "🔒"))}
      </div>
      <Badge
        style={{ borderColor: color, color }}
        className='mb-2 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider'
      >
        {resolvedStatus}
      </Badge>
      <p
        style={{ color }}
        className='font-mono text-base font-bold uppercase tracking-wider'
      >
        {String(emblem.name || "Unnamed Emblem")} • {acquiredDate}
      </p>
      <h3 className='mt-1 font-serif text-base font-bold tracking-tight text-white'>
        {String(emblem.title || "Untitled")}
      </h3>
      <p className='mt-2 flex-1 font-serif text-base leading-relaxed text-wheel-sand/80'>
        {String(emblem.description || "")}
      </p>
      <div className='mt-4 flex w-full flex-wrap justify-between gap-2 border-t border-white/10 pt-3 font-mono text-[10px] text-wheel-sand/60'>
        <span>{String(emblem.tagline ?? "")}</span>
        <span>{Array.isArray(emblem.tags) ? emblem.tags.join(" / ") : ""}</span>
      </div>
    </Card>
  );
}
