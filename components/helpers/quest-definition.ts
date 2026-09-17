export const questTags = ["holiday", "hobby", "dream", "archive"] as const;
export const questComponents = [
  "Lore",
  "Side quest",
  "Notes",
  "Pros and cons",
  "Moral values",
  "Lesson learned",
  "Scraps",
  "Artifacts",
  "Keepsakes",
] as const;
export const questStatuses = [
  "PLANNING",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type QuestComponent = (typeof questComponents)[number];
export type QuestTag = (typeof questTags)[number];
export type QuestSubQuest = {
  id: string;
  title: string;
  note: string;
  dueDate: string;
  points: number;
  done: boolean;
  mode?: string;
  priority?: string;
};
export type QuestConfiguration = {
  status?: string;
  tags: string[];
  components: QuestComponent[];
  subQuests: QuestSubQuest[];
  rating: number;
  notes: string;
  pros: string;
  cons: string;
  moralValues: string;
  lessonLearned: string;
  lore: string;
  scraps: string[];
  artifacts?: string[];
  keepsakes?: string[];
};
export type QuestLesson = { lesson: string; createdAt?: string };
export type QuestImage = {
  id: string;
  url: string;
  caption?: string;
  sourceType?: string;
  subquestRef?: string;
  createdAt?: string;
};
export type QuestAttachment = {
  id: string;
  url: string;
  caption?: string;
  createdAt?: string;
  kind: "artifact" | "keepsake";
};
export type Quest = {
  id?: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  locations?: string[];
  images?: QuestImage[];
  artifacts?: QuestAttachment[];
  keepsakes?: QuestAttachment[];
  description?: string;
  note: string;
  notes?: string;
  status: string;
  chapterId?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  rating?: number;
  pros?: string[];
  cons?: string[];
  moralValues?: string[];
  lessonLearned?: QuestLesson;
  configuration?: QuestConfiguration;
};
