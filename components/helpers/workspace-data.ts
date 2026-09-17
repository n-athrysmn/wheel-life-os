import type { SideQuest } from "../wheel/wheel-provider";
import type { Quest } from "./quest-definition";
import { initialMilestones, type Deadline } from "./deadlines";
export const initialSideQuests: SideQuest[] = [
  {
    id: 1,
    title: "Submit Scientist portrait & 100-word bio",
    note: "High-res portrait with lab backdrop attached",
    points: 5,
    done: true,
    dueDate: "2026-09-13",
  },
  {
    id: 2,
    title: "Draft lab equipment inventory & sensor specs",
    note: "ESP32 + BME280 temperature + soil moisture probe",
    points: 3,
    done: false,
    dueDate: "2026-09-16",
  },
  {
    id: 3,
    title: "Design interactive STEM workshop slide deck",
    note: "Interactive illustrated slides for Form 3 students",
    points: 2,
    done: false,
  },
  {
    id: 4,
    title: "Order prototype sensor kit (BME280 + OLED)",
    note: "Order from Cytron / local electronics store",
    points: 1,
    done: false,
    dueDate: "2026-09-12",
  },
];
export const initialQuests = [
  {
    title: "STI 100³ — Scientist Outreach",
    note: "ESP32 kits & youth science curriculum",
    status: "SHORTLISTED",
  },
  {
    title: "Career Upgrade",
    note: "Distributed systems & architectural portfolio",
    status: "ACTIVE",
  },
  {
    title: "Ts. Journey",
    note: "Professional engineering certification submission",
    status: "IN PROGRESS",
  },
  {
    title: "Korea Winter Trip",
    note: "Snowy Seoul, train ticket & winter itinerary",
    status: "PLANNING",
  },
  {
    title: "Build Wheel (Life OS)",
    note: "An intentional home for chronicles and quests",
    status: "ACTIVE",
  },
];
export type ChapterRecord = {
  name: string;
  start: string;
  end: string;
  intention: string;
  id: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  questIds?: string[];
  questIndices: number[] | null;
};
export type ChronicleRecord = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  start: string;
  end: string;
  status?: string;
  createdAt?: string;
  chapterIds: string[];
};

export type Chapter = {
  name: string;
  start: string;
  end: string;
  intention: string;
};
export type WorkspaceData = {
  sideQuests: SideQuest[];
  milestones: Deadline[];
  quests: Quest[];
  selected: number[];
  chapter: Chapter;
  chapters: ChapterRecord[];
  currentChapterId: string;
  draft: Chapter;
  activeSelected: number[] | null;
  wholeQuestComplete: boolean;
};
export function initialWorkspace(): WorkspaceData {
  const chapter = {
    name: "September — Plot Twist",
    start: "2026-09-01",
    end: "2026-09-30",
    intention: "Try things before talking myself out of them.",
  };
  return {
    sideQuests: initialSideQuests,
    milestones: initialMilestones,
    quests: initialQuests,
    selected: [0, 1, 2],
    chapter,
    chapters: [
      { ...chapter, id: "chapter-september", questIndices: [0, 1, 2, 4] },
    ],
    currentChapterId: "chapter-september",
    draft: {
      name: "October — Into the Deep Woods",
      start: "2026-10-01",
      end: "2026-10-31",
      intention:
        "Give priority to deep, quiet work before stepping out into public showcases.",
    },
    activeSelected: null,
    wholeQuestComplete: false,
  };
}
export function validWorkspace(value: unknown): value is WorkspaceData {
  if (!value || typeof value !== "object") return false;
  const data = value as WorkspaceData;
  const chapterValid = (chapter: Chapter) =>
    chapter &&
    [chapter.name, chapter.start, chapter.end, chapter.intention].every(
      (item) => typeof item === "string",
    );
  const validIndices = (items: unknown) =>
    Array.isArray(items) &&
    items.every(
      (index) =>
        Number.isInteger(index) && index >= 0 && index < data.quests.length,
    );
  if (
    !Array.isArray(data.quests) ||
    !data.quests.every(
      (q) =>
        q &&
        typeof q.title === "string" &&
        typeof q.note === "string" &&
        typeof q.status === "string" &&
        (!q.configuration ||
          (Array.isArray(q.configuration.tags) &&
            Array.isArray(q.configuration.components) &&
            Array.isArray(q.configuration.subQuests) &&
            q.configuration.subQuests.every(
              (sub) =>
                sub &&
                typeof sub.id === "string" &&
                typeof sub.title === "string" &&
                typeof sub.note === "string" &&
                typeof sub.dueDate === "string" &&
                [1, 2, 3, 5].includes(sub.points) &&
                typeof sub.done === "boolean",
            ))),
    )
  )
    return false;
  return (
    Array.isArray(data.sideQuests) &&
    data.sideQuests.every(
      (q) =>
        q &&
        typeof q.id === "number" &&
        typeof q.title === "string" &&
        typeof q.note === "string" &&
        [1, 2, 3, 5].includes(q.points) &&
        typeof q.done === "boolean",
    ) &&
    Array.isArray(data.milestones) &&
    data.milestones.every(
      (q) =>
        q &&
        typeof q.id === "string" &&
        typeof q.dueDate === "string" &&
        typeof q.title === "string" &&
        typeof q.done === "boolean",
    ) &&
    Array.isArray(data.chapters) &&
    data.chapters.every(
      (c) =>
        chapterValid(c) &&
        typeof c.id === "string" &&
        (c.questIndices === null || validIndices(c.questIndices)),
    ) &&
    chapterValid(data.chapter) &&
    chapterValid(data.draft) &&
    typeof data.currentChapterId === "string" &&
    data.chapters.some((c) => c.id === data.currentChapterId) &&
    validIndices(data.selected) &&
    (data.activeSelected === null || validIndices(data.activeSelected)) &&
    typeof data.wholeQuestComplete === "boolean"
  );
}
