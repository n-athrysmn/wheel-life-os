"use client";
export { initialQuests } from "../helpers/workspace-data";
import type { Quest } from "../helpers/quest-definition";
import { defaultScreen } from "../helpers/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { buildDeadlines, horizonFor } from "../helpers/deadlines";
import {
  initialWorkspace,
  type ChapterRecord,
  type ChronicleRecord,
} from "../helpers/workspace-data";
import { getFirebase } from "@/lib/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { AuthForm } from "./auth-form";
import {
  createChapter,
  createQuest as createQuestRecord,
  createQuestChild,
  getChapters,
  getChronicles,
  getEmblems,
  getLores,
  getQuests,
  getUser,
  updateChapter,
  updateChronicle,
  updateQuest,
  updateQuestChild,
} from "@/components/helpers/endpoints";
import type { FirebaseRecord } from "@/components/helpers/interface";
import type {
  QuestAttachment,
  QuestConfiguration,
  QuestImage,
  QuestSubQuest,
} from "../helpers/quest-definition";
import {
  endOfKualaLumpurDay,
  kualaLumpurDate,
  normalizeKualaLumpurBoundary,
  startOfKualaLumpurDay,
} from "../helpers/date-time";
export type SideQuest = {
  id: number;
  title: string;
  note: string;
  points: number;
  done: boolean;
  dueDate?: string;
};
function dateValue(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}
function textValues(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const text =
      record.lesson ??
      record.value ??
      record.text ??
      record.title ??
      record.name;
    return typeof text === "string" && text.trim() ? [text.trim()] : [];
  }
  return typeof value === "string" && value.trim() ? [value.trim()] : [];
}
function priorityPoints(value: unknown) {
  return (
    (
      { low: 1, easy: 1, medium: 2, high: 3, hard: 3, critical: 5 } as Record<
        string,
        number
      >
    )[String(value).toLowerCase()] ?? 1
  );
}
function lessonValue(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record.lesson === "string" && record.lesson.trim())
      return {
        lesson: record.lesson.trim(),
        createdAt:
          typeof record.createdAt === "string" ? record.createdAt : undefined,
      };
  }
  if (typeof value === "string" && value.trim())
    return { lesson: value.trim() };
  if (Array.isArray(value) && value.length) return { lesson: String(value[0]) };
  return undefined;
}
function questPayload(quest: Quest) {
  return {
    title: quest.title,
    subtitle: quest.subtitle ?? "",
    description: quest.description ?? quest.note,
    notes: quest.notes ?? "",
    tags: quest.tags ?? quest.configuration?.tags ?? [],
    locations: quest.locations ?? [],
    rating: quest.rating ?? quest.configuration?.rating ?? 0,
    status: quest.status.toLowerCase(),
    ...(quest.dueDate ? { dueAt: endOfKualaLumpurDay(quest.dueDate) } : {}),
    ...(quest.chapterId ? { chapterId: quest.chapterId } : {}),
    ...(quest.configuration ? { configuration: quest.configuration } : {}),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
function questChildWrites(questId: string, quest: Quest) {
  const createdAt = new Date().toISOString();
  return [
    ...(quest.images ?? []).map((item) =>
      createQuestChild(questId, "images", {
        url: item.url,
        caption: item.caption ?? "",
        sourceType: item.sourceType ?? "quest",
        createdAt,
      }),
    ),
    ...(quest.artifacts ?? []).map((item) =>
      createQuestChild(questId, "artifacts", {
        url: item.url,
        caption: item.caption ?? "",
        createdAt,
      }),
    ),
    ...(quest.keepsakes ?? []).map((item) =>
      createQuestChild(questId, "keepsakes", {
        url: item.url,
        caption: item.caption ?? "",
        createdAt,
      }),
    ),
  ];
}
function normalizeQuest(item: FirebaseRecord): Quest {
  const rawSubQuests = Array.isArray(item.subquests)
    ? item.subquests
    : Array.isArray(item.subQuests)
      ? item.subQuests
      : [];
  const subQuests: QuestSubQuest[] = rawSubQuests.flatMap((value, index) => {
    if (!value || typeof value !== "object") return [];
    const sub = value as Record<string, unknown>;
    const subStatus = String(sub.status).toLowerCase();
    return [
      {
        id: String(sub.id ?? index),
        title: String(sub.title ?? "Untitled Side Quest"),
        note: String(sub.note ?? sub.description ?? ""),
        dueDate: dateValue(sub.dueDate ?? sub.dueAt ?? sub.due_date),
        points: Number(sub.points ?? priorityPoints(sub.priority)),
        done:
          sub.done === true ||
          subStatus === "completed" ||
          subStatus === "done",
        mode: typeof sub.mode === "string" ? sub.mode : undefined,
        priority: typeof sub.priority === "string" ? sub.priority : undefined,
      },
    ];
  });
  const existing =
    item.configuration && typeof item.configuration === "object"
      ? (item.configuration as QuestConfiguration)
      : undefined;
  const images: QuestImage[] = (
    Array.isArray(item.images) ? item.images : []
  ).flatMap((value, index) => {
    if (!value || typeof value !== "object") return [];
    const image = value as Record<string, unknown>;
    const url =
      typeof image.url === "string" && /^https?:\/\//.test(image.url)
        ? image.url
        : "";
    return url
      ? [
          {
            id: String(image.id ?? index),
            url,
            caption:
              typeof image.caption === "string" ? image.caption : undefined,
            sourceType:
              typeof image.sourceType === "string"
                ? image.sourceType
                : undefined,
            subquestRef:
              typeof image.subquestRef === "string"
                ? image.subquestRef
                : undefined,
            createdAt:
              typeof image.createdAt === "string" ? image.createdAt : undefined,
          },
        ]
      : [];
  });
  const attachments = (
    value: unknown,
    kind: QuestAttachment["kind"],
  ): QuestAttachment[] =>
    (Array.isArray(value) ? value : []).flatMap((entry, index) => {
      if (!entry || typeof entry !== "object") return [];
      const record = entry as Record<string, unknown>;
      const url = typeof record.url === "string" ? record.url.trim() : "";
      return url
        ? [
            {
              id: String(record.id ?? index),
              url,
              caption:
                typeof record.caption === "string" ? record.caption : undefined,
              createdAt:
                typeof record.createdAt === "string"
                  ? record.createdAt
                  : undefined,
              kind,
            },
          ]
        : [];
    });
  const effectiveSubQuests = subQuests.length
    ? subQuests
    : (existing?.subQuests ?? []);
  const configuration =
    existing || effectiveSubQuests.length
      ? {
          tags: [],
          rating: 0,
          notes: "",
          pros: "",
          cons: "",
          moralValues: "",
          lessonLearned: "",
          lore: "",
          scraps: [],
          ...existing,
          subQuests: effectiveSubQuests,
          components: (
            existing?.components ??
            (effectiveSubQuests.length ? ["Side quest"] : [])
          ).map((component) =>
            component === ("Sub quest" as string) ? "Side quest" : component,
          ) as QuestConfiguration["components"],
        }
      : undefined;
  return {
    ...item,
    id: item.id,
    title: String(item.title ?? "Untitled Quest"),
    subtitle: typeof item.subtitle === "string" ? item.subtitle : undefined,
    tags: Array.isArray(item.tags) ? item.tags.map(String) : existing?.tags,
    locations: textValues(item.locations),
    images,
    artifacts: attachments(item.artifacts, "artifact"),
    keepsakes: attachments(item.keepsakes, "keepsake"),
    description:
      typeof item.description === "string" ? item.description : undefined,
    note: String(item.note ?? item.description ?? ""),
    notes: typeof item.notes === "string" ? item.notes : existing?.notes,
    status: String(item.status ?? "PLANNING").toUpperCase(),
    startDate: dateValue(item.startDate ?? item.startsAt ?? item.start),
    endDate: dateValue(item.endDate ?? item.endsAt ?? item.end),
    dueDate: dateValue(item.dueDate ?? item.dueAt ?? item.due_date),
    rating: Number(item.rating ?? existing?.rating ?? 0),
    pros: textValues(item.pros ?? existing?.pros),
    cons: textValues(item.cons ?? existing?.cons),
    moralValues: textValues(
      item.moral_values ?? item.moralValues ?? existing?.moralValues,
    ),
    lessonLearned: lessonValue(
      item.lesson_learned ?? item.lessonLearned ?? existing?.lessonLearned,
    ),
    configuration,
  };
}
function useWheelState() {
  const defaults = initialWorkspace();
  const [view, setView] = useState<string>(defaultScreen);
  const [questDetailOrigin, setQuestDetailOrigin] = useState("screen-4");
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(0);
  function openQuest(index: number, origin?: "screen-1" | "screen-4") {
    setQuestDetailOrigin(
      origin ?? (view === "screen-1" ? "screen-1" : "screen-4"),
    );
    setSelectedQuestIndex(index);
    setView("screen-2");
  }
  const [celebrating, setCelebrating] = useState(false);
  const [addingSideQuest, setAddingSideQuest] = useState(false);
  const [editingSideQuest, setEditingSideQuest] = useState<SideQuest | null>(
    null,
  );
  const [wholeQuestComplete, setWholeQuestComplete] = useState(
    defaults.wholeQuestComplete,
  );
  const [addingQuest, setAddingQuest] = useState(false);
  const [sideQuests, setSideQuests] = useState<SideQuest[]>([]);
  const [milestones, setMilestones] = useState<
    ReturnType<typeof buildDeadlines>
  >([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [profile, setProfile] = useState<FirebaseRecord | null>(null);
  const [emblems, setEmblems] = useState<FirebaseRecord[]>([]);
  const [lores, setLores] = useState<FirebaseRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const deadlines = buildDeadlines(sideQuests, milestones, quests);
  const closingSoon = deadlines.filter(
    (item) => !item.done && horizonFor(item.dueDate) === "urgent",
  ).length;
  async function resolveDeadline(id: string) {
    const deadline = deadlines.find((item) => item.id === id);
    if (!deadline || deadline.done) return;
    const quest =
      deadline.questIndex !== undefined
        ? quests[deadline.questIndex]
        : undefined;
    if (quest?.id) {
      setActionLoading("Sealing the Quest…");
      const questId = String(quest.id).split("/").at(-1) || String(quest.id);
      const response = deadline.subQuestId
        ? await updateQuestChild(questId, "subquests", deadline.subQuestId, {
            status: "done",
            updatedAt: new Date().toISOString(),
          })
        : await updateQuest(questId, {
            status: "completed",
            updatedAt: new Date().toISOString(),
          });
      setActionLoading(null);
      if (response.status >= 400 || response.data instanceof Error) {
        setNotice(
          response.data instanceof Error
            ? response.data.message
            : "Could not complete this waypoint.",
        );
        return;
      }
    }
    if (deadline?.sideQuestId !== undefined)
      setSideQuests((items) =>
        items.map((item) =>
          item.id === deadline.sideQuestId ? { ...item, done: true } : item,
        ),
      );
    else if (deadline?.questIndex !== undefined && deadline.subQuestId)
      setQuests((items) =>
        items.map((item, index) =>
          index === deadline.questIndex && item.configuration
            ? {
                ...item,
                configuration: {
                  ...item.configuration,
                  subQuests: item.configuration.subQuests.map((sub) =>
                    sub.id === deadline.subQuestId
                      ? { ...sub, done: true }
                      : sub,
                  ),
                },
              }
            : item,
        ),
      );
    else if (deadline?.questIndex !== undefined)
      setQuests((items) =>
        items.map((item, index) =>
          index === deadline.questIndex
            ? {
                ...item,
                status: "COMPLETED",
                configuration: item.configuration
                  ? { ...item.configuration, status: "COMPLETED" }
                  : undefined,
              }
            : item,
        ),
      );
    else
      setMilestones((items) =>
        items.map((item) => (item.id === id ? { ...item, done: true } : item)),
      );
  }
  const [mapFilter, setMapFilter] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [chapter, setChapter] = useState(defaults.chapter);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [chronicles, setChronicles] = useState<ChronicleRecord[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState("");
  function openChapter(id: string) {
    setCurrentChapterId(id);
    setView("screen-1");
  }
  const [chaptersLoaded, setChaptersLoaded] = useState(false);
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState(false);
  const [draftQuestIds, setDraftQuestIds] = useState<string[]>([]);
  function discardDraftQuests() {
    setQuests((items) =>
      items.filter((quest) => !draftQuestIds.includes(String(quest.id))),
    );
    setSelected((items) => items.filter((id) => !draftQuestIds.includes(id)));
    setDraftQuestIds([]);
  }
  function closeChapterEditor() {
    discardDraftQuests();
    setCreatingChapter(false);
    setEditingChapter(false);
  }
  function openCreateChapter(preserveSelection = false) {
    discardDraftQuests();
    setEditingChapter(false);
    setDraft({ name: "", start: "", end: "", intention: "" });
    if (!preserveSelection) setSelected([]);
    setCreatingChapter(true);
    setView("screen-8");
  }
  const [draft, setDraft] = useState(defaults.draft);
  const [activeSelected, setActiveSelected] = useState<number[] | null>(
    defaults.activeSelected,
  );
  const [notice, setNotice] = useState("");
  function openEditCurrentChapter() {
    const current = chapters.find((item) => item.id === currentChapterId);
    if (!current) return;
    const questIds =
      current.questIds?.flatMap((questId) => {
        const id = String(questId).split("/").at(-1) || String(questId);
        return quests.some((quest) => String(quest.id).split("/").at(-1) === id)
          ? [id]
          : [];
      }) ??
      (current.questIndices ?? []).flatMap((index) =>
        quests[index]?.id ? [String(quests[index].id).split("/").at(-1)!] : [],
      );
    setDraft({
      name: current.name,
      start: kualaLumpurDate(current.start),
      end: kualaLumpurDate(current.end),
      intention: current.intention,
    });
    setSelected([...new Set(questIds)]);
    setEditingChapter(true);
    setCreatingChapter(true);
    setView("screen-8");
  }
  const totalPoints = sideQuests.reduce((sum, quest) => sum + quest.points, 0);
  const completedPoints = sideQuests.reduce(
    (sum, quest) => sum + (quest.done ? quest.points : 0),
    0,
  );
  const completedCount = sideQuests.filter((quest) => quest.done).length;
  const progress = totalPoints
    ? Math.round((completedPoints / totalPoints) * 100)
    : wholeQuestComplete
      ? 100
      : 0;
  async function refreshData() {
    setDataError("");
    const [
      userResponse,
      questResponse,
      chapterResponse,
      chronicleResponse,
      emblemResponse,
      loreResponse,
    ] = await Promise.all([
      getUser(),
      getQuests(),
      getChapters(),
      getChronicles(),
      getEmblems(),
      getLores(),
    ]);
    if (
      userResponse.status === 200 &&
      userResponse.data &&
      !(userResponse.data instanceof Error)
    )
      setProfile(userResponse.data as FirebaseRecord);
    if (questResponse.status === 200 && Array.isArray(questResponse.data))
      setQuests((questResponse.data as FirebaseRecord[]).map(normalizeQuest));
    if (chapterResponse.status === 200 && Array.isArray(chapterResponse.data)) {
      const loaded = (chapterResponse.data as FirebaseRecord[]).map((item) => ({
        id: item.id,
        name: String(item.name ?? item.title ?? "Untitled Chronicle"),
        start: normalizeKualaLumpurBoundary(
          item.start ?? item.startDate ?? item.startsAt,
          "start",
        ),
        end: normalizeKualaLumpurBoundary(
          item.end ?? item.endDate ?? item.endsAt,
          "end",
        ),
        intention: String(
          item.intention ?? item.intentionalFocus ?? item.description ?? "",
        ),
        status: typeof item.status === "string" ? item.status : undefined,
        createdAt:
          typeof item.createdAt === "string" ? item.createdAt : undefined,
        updatedAt:
          typeof item.updatedAt === "string" ? item.updatedAt : undefined,
        questIds: Array.isArray(item.questIds)
          ? item.questIds.map(
              (value) => String(value).split("/").at(-1) || String(value),
            )
          : undefined,
        questIndices: Array.isArray(item.questIndices)
          ? item.questIndices.filter((value) => typeof value === "number")
          : null,
      }));
      setChapters(loaded);
      setCurrentChapterId(
        loaded.find((item) => item.status?.toLowerCase() === "ongoing")?.id ??
          "",
      );
    }
    if (
      chronicleResponse.status === 200 &&
      Array.isArray(chronicleResponse.data)
    )
      setChronicles(
        (chronicleResponse.data as FirebaseRecord[]).map((item) => ({
          id: item.id,
          title: String(item.title ?? "Untitled Chronicle"),
          subtitle:
            typeof item.subtitle === "string" ? item.subtitle : undefined,
          description: String(item.description ?? ""),
          start: normalizeKualaLumpurBoundary(
            item.start ?? item.startDate ?? item.startsAt,
            "start",
          ),
          end: normalizeKualaLumpurBoundary(
            item.end ?? item.endDate ?? item.endsAt,
            "end",
          ),
          status: typeof item.status === "string" ? item.status : undefined,
          createdAt:
            typeof item.createdAt === "string" ? item.createdAt : undefined,
          chapterIds: (Array.isArray(item.chaptersId)
            ? item.chaptersId
            : Array.isArray(item.chapterIds)
              ? item.chapterIds
              : []
          ).map((value) => String(value).split("/").at(-1) || String(value)),
        })),
      );
    if (emblemResponse.status === 200 && Array.isArray(emblemResponse.data))
      setEmblems(emblemResponse.data as FirebaseRecord[]);
    if (loreResponse.status === 200 && Array.isArray(loreResponse.data))
      setLores(loreResponse.data as FirebaseRecord[]);
    const failed = [
      userResponse,
      questResponse,
      chapterResponse,
      chronicleResponse,
      emblemResponse,
      loreResponse,
    ].find((response) => response.status >= 400);
    if (failed)
      setDataError(
        failed.data instanceof Error
          ? failed.data.message
          : "Some Wheel data could not be loaded.",
      );
    setChaptersLoaded(true);
    setDataLoading(false);
  }
  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void refreshData();
    }, 0);
    const refresh = () => {
      void refreshData();
    };
    window.addEventListener("wheel:data-changed", refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("wheel:data-changed", refresh);
    };
  }, []);
  async function createQuest(quest: Quest) {
    const questWithStatus: Quest = {
      ...quest,
      status: creatingChapter || quest.chapterId ? "ACTIVE" : "PLANNING",
    };
    if (creatingChapter) {
      const id = `draft-${crypto.randomUUID()}`;
      setQuests((items) => [...items, { ...questWithStatus, id }]);
      setDraftQuestIds((items) => [...items, id]);
      setSelected((items) => (items.includes(id) ? items : [...items, id]));
      return true;
    }
    setActionLoading("Updating the Quest…");
    const response = await createQuestRecord(questPayload(questWithStatus));
    if (response.status >= 400 || response.data instanceof Error) {
      setActionLoading(null);
      setNotice(
        response.data instanceof Error
          ? response.data.message
          : "Could not create quest.",
      );
      return false;
    }
    const saved = normalizeQuest(response.data as FirebaseRecord);
    const childResponses = await Promise.all(
      questChildWrites(String(saved.id), questWithStatus),
    );
    const childFailure = childResponses.find(
      (item) => item.status >= 400 || item.data instanceof Error,
    );
    if (childFailure) {
      setActionLoading(null);
      setNotice(
        childFailure.data instanceof Error
          ? childFailure.data.message
          : "The quest was saved, but one of its components could not be saved.",
      );
      return false;
    }
    const index = quests.length;
    const savedQuestId =
      String(saved.id ?? "")
        .split("/")
        .at(-1) ?? "";
    if (saved.chapterId) {
      const targetChapter = chapters.find(
        (item) => item.id === saved.chapterId,
      );
      const questIds = [
        ...new Set(
          [...(targetChapter?.questIds ?? []), savedQuestId].filter(Boolean),
        ),
      ];
      const chapterResponse = await updateChapter(saved.chapterId, {
        questIds,
        updatedAt: new Date().toISOString(),
      });
      if (
        chapterResponse.status >= 400 ||
        chapterResponse.data instanceof Error
      ) {
        setActionLoading(null);
        setNotice(
          chapterResponse.data instanceof Error
            ? chapterResponse.data.message
            : "The quest was saved, but could not be attached to its chapter.",
        );
        return false;
      }
    }
    setActionLoading(null);
    setQuests((items) => [
      ...items,
      {
        ...saved,
        images: questWithStatus.images,
        artifacts: questWithStatus.artifacts,
        keepsakes: questWithStatus.keepsakes,
      },
    ]);
    if (saved.chapterId) {
      setChapters((items) =>
        items.map((item) =>
          item.id === saved.chapterId
            ? {
                ...item,
                questIds: [
                  ...new Set([...(item.questIds ?? []), savedQuestId]),
                ],
                questIndices: [
                  ...new Set([...(item.questIndices ?? []), index]),
                ],
              }
            : item,
        ),
      );
      if (saved.chapterId === currentChapterId)
        setActiveSelected((items) => [...(items ?? [0, 1, 2, 4]), index]);
    }
    return true;
  }
  async function beginChapter() {
    if (
      !draft.name.trim() ||
      !draft.start ||
      !draft.end ||
      draft.end < draft.start
    ) {
      setNotice("Name your chapter and choose a valid date range.");
      return;
    }
    const draftQuests = quests.filter((quest) =>
      draftQuestIds.includes(String(quest.id)),
    );
    const savedQuestIds = new Map(
      draftQuests.map((quest) => [String(quest.id), crypto.randomUUID()]),
    );
    const questIds = selected.map((id) => savedQuestIds.get(id) ?? id);
    const today = new Date().toISOString().slice(0, 10);
    const existing = chapters.find((item) => item.id === currentChapterId);
    const status =
      editingChapter && existing?.status
        ? existing.status
        : draft.end < today
          ? "completed"
          : draft.start > today
            ? "upcoming"
            : "ongoing";
    const payload = {
      title: draft.name.trim(),
      intention: draft.intention.trim(),
      startsAt: startOfKualaLumpurDay(draft.start),
      endsAt: endOfKualaLumpurDay(draft.end),
      questIds,
      status,
      updatedAt: new Date().toISOString(),
      ...(editingChapter ? {} : { createdAt: new Date().toISOString() }),
    };
    setActionLoading(
      editingChapter ? "Revising the Plot…" : "Setting the Plot…",
    );
    const [response, ...questResponses] = await Promise.all([
      editingChapter
        ? updateChapter(currentChapterId, payload)
        : createChapter(payload),
      ...draftQuests.flatMap((quest) => {
        const questId = savedQuestIds.get(String(quest.id))!;
        return [
          createQuestRecord({ ...questPayload(quest), _documentId: questId }),
          ...questChildWrites(questId, quest),
        ];
      }),
    ]);
    const failedDraft = questResponses.find(
      (item) => item.status >= 400 || item.data instanceof Error,
    );
    if (failedDraft) {
      setActionLoading(null);
      setNotice(
        failedDraft.data instanceof Error
          ? failedDraft.data.message
          : "Could not save a sketched quest.",
      );
      return;
    }
    if (response.status >= 400 || response.data instanceof Error) {
      setActionLoading(null);
      setNotice(
        response.data instanceof Error
          ? response.data.message
          : "Could not save chapter.",
      );
      return;
    }
    await Promise.all(
      draftQuests.flatMap((quest) => {
        const questId = savedQuestIds.get(String(quest.id));
        if (!questId) return [];
        return [
          ...(quest.artifacts ?? []).map((item) =>
            createQuestChild(questId, "artifacts", {
              url: item.url,
              caption: item.caption ?? "",
              createdAt: new Date().toISOString(),
            }),
          ),
          ...(quest.keepsakes ?? []).map((item) =>
            createQuestChild(questId, "keepsakes", {
              url: item.url,
              caption: item.caption ?? "",
              createdAt: new Date().toISOString(),
            }),
          ),
        ];
      }),
    );
    const savedId = String((response.data as FirebaseRecord).id);
    await Promise.all(
      chronicles.flatMap((chronicle) => {
        const contains =
          kualaLumpurDate(chronicle.start) <= draft.end &&
          kualaLumpurDate(chronicle.end) >= draft.start;
        const ids = chronicle.chapterIds.filter(
          (id) => id !== currentChapterId && id !== savedId,
        );
        if (contains) ids.push(savedId);
        const changed = ids.join("|") !== chronicle.chapterIds.join("|");
        return changed
          ? [
              updateChronicle(chronicle.id, {
                chaptersId: ids,
                updatedAt: new Date().toISOString(),
              }),
            ]
          : [];
      }),
    );
    await refreshData();
    setDraftQuestIds([]);
    setCurrentChapterId(savedId);
    setCreatingChapter(false);
    setEditingChapter(false);
    setActiveSelected(
      selected.flatMap((id) => {
        const index = quests.findIndex(
          (quest) => String(quest.id).split("/").at(-1) === id,
        );
        return index >= 0 ? [index] : [];
      }),
    );
    setChapter({ ...draft, name: draft.name.trim() });
    setView("screen-1");
    setNotice(
      editingChapter
        ? "The chapter has been updated."
        : "Your new chapter has been saved.",
    );
    setActionLoading(null);
  }
  return {
    selectedQuestIndex,
    questDetailOrigin,
    openQuest,
    createQuest,
    mapFilter,
    setMapFilter,
    chapters,
    chronicles,
    setChapters,
    currentChapterId,
    openChapter,
    chaptersLoaded,
    creatingChapter,
    editingChapter,
    setCreatingChapter,
    closeChapterEditor,
    openCreateChapter,
    openEditCurrentChapter,
    deadlines,
    closingSoon,
    resolveDeadline,
    editingSideQuest,
    setEditingSideQuest,
    wholeQuestComplete,
    setWholeQuestComplete,
    activeSelected,
    view,
    setView,
    celebrating,
    setCelebrating,
    addingSideQuest,
    setAddingSideQuest,
    addingQuest,
    setAddingQuest,
    sideQuests,
    setSideQuests,
    quests,
    setQuests,
    profile,
    emblems,
    lores,
    dataLoading,
    dataError,
    actionLoading,
    setActionLoading,
    refreshData,
    selected,
    setSelected,
    chapter,
    draft,
    setDraft,
    progress,
    completedCount,
    completedPoints,
    totalPoints,
    beginChapter,
    notice,
    setNotice,
  };
}
const WheelContext = createContext<ReturnType<typeof useWheelState> | null>(
  null,
);
export function WheelProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginNow, setLoginNow] = useState<Date | null>(null);
  useEffect(
    () =>
      onAuthStateChanged(getFirebase().auth, (account) => {
        setUser(account);
        setAuthReady(true);
      }),
    [],
  );
  useEffect(() => {
    const updateClock = () => setLoginNow(new Date());
    updateClock();
    const clock = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(clock);
  }, []);
  if (!authReady)
    return (
      <main className='min-h-screen grid place-items-center bg-paper-subtle'>
        <p role='status' className='font-serif text-xl'>
          Opening Wheel…
        </p>
      </main>
    );
  if (!user)
    return (
      <main className='relative min-h-dvh overflow-y-auto bg-paper-subtle px-5 py-8'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 bg-linear-to-b from-wheel-navy/35 via-transparent to-wheel-navy/45'
        />
        <div className='relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-5xl flex-col items-center'>
          <header className='text-center text-wheel-cream drop-shadow-[0_2px_8px_rgba(13,20,31,.45)]'>
            <p className='text-xl font-semibold md:text-2xl'>
              {loginNow
                ? new Intl.DateTimeFormat(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }).format(loginNow)
                : ""}
            </p>
            <time
              dateTime={loginNow?.toISOString()}
              className='mt-1 block font-sans text-2xl font-light leading-none tracking-[-.07em] md:text-[5rem]'
            >
              {loginNow
                ? new Intl.DateTimeFormat(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hourCycle: "h23",
                  }).format(loginNow)
                : ""}
            </time>
          </header>

          <section
            aria-label='Choose an account'
            className='mt-auto w-full max-w-xs pb-[4dvh] text-wheel-cream md:max-w-sm'
          >
            <AuthForm lockScreen />
          </section>
        </div>
      </main>
    );
  return <WheelStateProvider>{children}</WheelStateProvider>;
}
function WheelStateProvider({ children }: { children: ReactNode }) {
  const state = useWheelState();
  const [guestMutationResolver, setGuestMutationResolver] = useState<
    ((choice: "session" | "login") => void) | null
  >(null);
  useEffect(() => {
    const showWarning = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          resolve: (choice: "session" | "login") => void;
        }>
      ).detail;
      setGuestMutationResolver(() => detail.resolve);
    };
    window.addEventListener("wheel:guest-mutation", showWarning);
    return () =>
      window.removeEventListener("wheel:guest-mutation", showWarning);
  }, []);
  if (state.dataLoading)
    return (
      <main className='min-h-screen grid place-items-center bg-paper-subtle'>
        <div role='status' aria-live='polite' className='text-center'>
          <span className='mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-wheel-sand border-t-wheel-gold' />
          <p className='mt-4 font-serif text-xl text-wheel-ink'>
            Loading your Wheel…
          </p>
          <p className='mt-1 text-sm text-wheel-slate'>
            Gathering chronicles, quests, lore, and emblems.
          </p>
        </div>
      </main>
    );
  return (
    <WheelContext.Provider value={state}>
      {children}
      {state.actionLoading && (
        <div
          className='fixed inset-0 z-100 grid place-items-center bg-wheel-navy/45 p-6 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-label='Saving changes'
        >
          <div className='min-w-72 rounded-2xl border border-wheel-gold/50 bg-wheel-parchmentLight p-7 text-center shadow-card-lift'>
            <span className='mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-wheel-sand border-t-wheel-gold' />
            <p className='mt-4 font-serif text-xl font-bold text-wheel-ink'>
              {state.actionLoading}
            </p>
            <p className='mt-1 text-base text-wheel-slate'>
              Please keep this window open.
            </p>
          </div>
        </div>
      )}
      {guestMutationResolver && (
        <div
          className='fixed inset-0 z-110 grid place-items-center bg-wheel-navy/45 p-6 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-labelledby='guest-save-warning-title'
        >
          <div className='w-full max-w-md rounded-2xl border border-wheel-gold/50 bg-wheel-parchmentLight p-7 text-center shadow-card-lift'>
            <h2
              id='guest-save-warning-title'
              className='font-serif text-2xl font-bold text-wheel-ink'
            >
              Save your changes
            </h2>
            <p className='mt-3 text-sm leading-6 text-wheel-slate'>
              Create an account or log in to save changes. Otherwise, they will
              only be saved for this session, and closing the tab will clear all
              data.
            </p>
            <div className='mt-6 flex flex-wrap justify-center gap-3'>
              <button
                type='button'
                onClick={() => {
                  guestMutationResolver("session");
                  setGuestMutationResolver(null);
                }}
                className='rounded-lg border border-wheel-sand px-4 py-2 text-sm text-wheel-ink'
              >
                Continue this session
              </button>
              <button
                type='button'
                onClick={() => {
                  guestMutationResolver("login");
                  setGuestMutationResolver(null);
                  void signOut(getFirebase().auth);
                }}
                className='rounded-lg bg-wheel-navy px-4 py-2 text-sm text-wheel-cream'
              >
                Create account / Login
              </button>
            </div>
          </div>
        </div>
      )}
    </WheelContext.Provider>
  );
}
export function useWheel() {
  const context = useContext(WheelContext);
  if (!context) throw new Error("Wheel components require WheelProvider");
  return context;
}
