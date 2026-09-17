import type { Quest } from "./quest-definition";
import type { SideQuest } from "../wheel/wheel-provider";
function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export const radarDate = localDate();
export type Deadline = {
  id: string;
  title: string;
  note: string;
  dueDate: string;
  type: "sidequest" | "quest";
  quest: string;
  done: boolean;
  points?: number;
  subQuestId?: string;
  questIndex?: number;
  sideQuestId?: number;
};
export type Horizon = "urgent" | "week" | "later";
export function millisecondsUntil(date: string) {
  const due = Date.parse(
    date.includes("T") ? date : `${date.slice(0, 10)}T23:59:59+08:00`,
  );
  return due - Date.now();
}
export function daysUntil(date: string) {
  return Math.ceil(millisecondsUntil(date) / 86400000);
}
export function horizonFor(date: string): Horizon {
  const remaining = millisecondsUntil(date);
  return remaining < 72 * 60 * 60 * 1000
    ? "urgent"
    : remaining <= 7 * 24 * 60 * 60 * 1000
      ? "week"
      : "later";
}
export function buildDeadlines(
  sideQuests: SideQuest[],
  milestones: Deadline[],
  quests: Quest[] = [],
): Deadline[] {
  return [
    ...sideQuests
      .filter((quest) => quest.dueDate)
      .map((quest) => ({
        id: `side-${quest.id}`,
        sideQuestId: quest.id,
        title: quest.title,
        note: quest.note,
        dueDate: quest.dueDate!,
        type: "sidequest" as const,
        quest: "STI 100³",
        done: quest.done,
        points: quest.points,
      })),
    ...milestones,
    ...quests.flatMap((quest, index): Deadline[] =>
      quest.status === "ARCHIVED"
        ? []
        : (quest.configuration?.subQuests ?? [])
            .filter((item) => item.dueDate)
            .map((item) => ({
              id: `quest-${index}-sub-${item.id}`,
              questIndex: index,
              subQuestId: item.id,
              title: item.title,
              note: item.note,
              dueDate: item.dueDate,
              type: "sidequest",
              quest: quest.title,
              done: item.done || quest.status === "COMPLETED",
              points: item.points,
            })),
    ),
    ...quests.flatMap((quest, index): Deadline[] =>
      quest.dueDate && quest.status !== "ARCHIVED"
        ? [
            {
              id: `quest-${index}`,
              questIndex: index,
              title: quest.title,
              note: quest.note,
              dueDate: quest.dueDate,
              type: "quest",
              quest: quest.title,
              done: quest.status === "COMPLETED",
            },
          ]
        : [],
    ),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
export const initialMilestones: Deadline[] = [
  {
    id: "raft",
    title: "Benchmarking Raft leader leases",
    note: "Run local latency profiling script across 5 virtual nodes with simulated network drops.",
    dueDate: "2026-09-17",
    type: "sidequest",
    quest: "Career Upgrade",
    points: 5,
    done: false,
  },
  {
    id: "cpd",
    title: "Submit CPD points certification",
    note: "Collate webinar attendance receipts and technical seminar credits.",
    dueDate: "2026-09-18",
    type: "sidequest",
    quest: "Ts. Journey",
    points: 2,
    done: false,
  },
  {
    id: "ceremony",
    title: "STI 100³ Opening Ceremony & Keynote",
    note: "Dewan Filharmonik / Grand Ballroom • Wear formal batik or academic attire.",
    dueDate: "2026-09-21",
    type: "quest",
    quest: "Fellowship Ceremony",
    done: false,
  },
  {
    id: "concert",
    title: "Beethoven Symphony No. 7",
    note: "Malaysian Philharmonic Orchestra • Box Tier 2 Seat 14.",
    dueDate: "2026-10-04",
    type: "quest",
    quest: "Classical Era",
    done: false,
  },
];
