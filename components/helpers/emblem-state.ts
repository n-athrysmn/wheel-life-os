import type { FirebaseRecord } from "@/components/helpers/interface";
import type { Quest } from "./quest-definition";
import type { ChapterRecord, ChronicleRecord } from "./workspace-data";

export type EmblemStatus = "locked" | "forging" | "unlocked";
function id(value: unknown) {
  return (
    String(value ?? "")
      .trim()
      .split("/")
      .at(-1) ?? ""
  );
}
function ids(value: unknown) {
  return Array.isArray(value) ? value.map(id).filter(Boolean) : [];
}
function status(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[ _-]+/g, "");
}
const completeStatuses = new Set([
  "completed",
  "done",
  "published",
  "mastered",
  "unlocked",
]);
const waitingStatuses = new Set([
  "",
  "planning",
  "planned",
  "upcoming",
  "draft",
  "locked",
  "notstarted",
]);

export function resolveEmblemStatus(
  emblem: FirebaseRecord,
  quests: Quest[],
  chapters: ChapterRecord[],
  chronicles: ChronicleRecord[],
) {
  const links = [
    ...ids(emblem.questIds).map((linkedId) =>
      quests.find((item) => id(item.id) === linkedId),
    ),
    ...ids(emblem.chapterIds).map((linkedId) =>
      chapters.find((item) => id(item.id) === linkedId),
    ),
    ...ids(emblem.chronicleIds).map((linkedId) =>
      chronicles.find((item) => id(item.id) === linkedId),
    ),
  ];
  if (!links.length)
    return { status: "locked" as EmblemStatus, acquiredStatus: false };
  const allCompleted =
    links.every(Boolean) &&
    links.every((item) => completeStatuses.has(status(item?.status)));
  if (allCompleted)
    return { status: "unlocked" as EmblemStatus, acquiredStatus: true };
  const hasMovement = links.some((item) => {
    if (!item) return false;
    if (!waitingStatuses.has(status(item.status))) return true;
    return (
      "configuration" in item &&
      Boolean(
        (item as Quest).configuration?.subQuests?.some(
          (subquest) => subquest.done,
        ),
      )
    );
  });
  return {
    status: hasMovement
      ? ("forging" as EmblemStatus)
      : ("locked" as EmblemStatus),
    acquiredStatus: false,
  };
}

export function emblemTheme(value: unknown) {
  const theme = String(value ?? "").trim();
  const named: Record<string, string> = {
    gold: "#c59a45",
    sage: "#79a58b",
    blue: "#80adcf",
    red: "#d27764",
    rose: "#d88a9a",
    purple: "#9c90ba",
    silver: "#aeb8c5",
    bronze: "#b48740",
  };
  return (
    named[theme.toLowerCase()] ??
    (/^#[0-9a-f]{3,8}$/i.test(theme) ? theme : "#c59a45")
  );
}
