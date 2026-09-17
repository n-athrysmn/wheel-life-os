import { Button, Badge, Card, ProgressBar, ScreenFrame } from "../ui";
import { useWheel } from "../wheel-provider";
import { Modal } from "../modal";
import { RichTextEditor } from "../rich-text-editor";
import type { QuestSubQuest } from "../../helpers/quest-definition";
import { useState } from "react";
import {
  createLore,
  createQuestChild,
  updateQuest,
  updateQuestChild,
} from "@/components/helpers/endpoints";
import { endOfKualaLumpurDay, kualaLumpurDate } from "../../helpers/date-time";
import type { FirebaseRecord } from "@/components/helpers/interface";

const difficulty: Record<number, { label: string; color: string }> = {
  5: { label: "CRITICAL", color: "priority-badge priority-critical" },
  3: { label: "HARD", color: "priority-badge priority-hard" },
  2: { label: "MEDIUM", color: "priority-badge priority-medium" },
  1: { label: "EASY", color: "priority-badge priority-easy" },
};

const ratingLabels: Record<number, string> = {
  1: "Dud",
  2: "Decent",
  3: "Worth It",
  4: "Epic",
  5: "Flame",
};

function questId(value: unknown) {
  return (
    String(value ?? "")
      .split("/")
      .at(-1) ?? ""
  );
}

function emblemBelongsToQuest(
  emblem: FirebaseRecord,
  id: string,
  title: string,
) {
  const references = [
    ...(Array.isArray(emblem.questIds) ? emblem.questIds : []),
    emblem.questId,
    emblem.questRef,
  ].filter(Boolean);

  if (references.some((value) => questId(value) === id)) return true;

  const questLabel = String(emblem.quest ?? emblem.questTitle ?? "").trim();
  return Boolean(
    questLabel && questLabel.toLowerCase() === title.toLowerCase(),
  );
}

function shortDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

function lessonDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

function loreDate(value: unknown) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function ActionIcon({ remove = false }: { remove?: boolean }) {
  return (
    <svg
      aria-hidden='true'
      className='h-4 w-4'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d={
          remove
            ? "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        }
      />
    </svg>
  );
}

type HeroDraft = {
  title: string;
  subtitle: string;
  dueDate: string;
  rating: number;
  description: string;
  locations: string;
  tags: string;
};
type ScrapDraft = { url: string; caption: string };
type AttachmentDraft = {
  kind: "artifact" | "keepsake";
  url: string;
  caption: string;
};

function hasRichText(value?: string) {
  return Boolean(
    value
      ?.replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim(),
  );
}

export function QuestDetail() {
  const {
    selectedQuestIndex: index,
    questDetailOrigin,
    quests,
    setQuests,
    chapters,
    emblems,
    setView,
    lores,
    setActionLoading,
  } = useWheel();
  const [subquestDraft, setSubquestDraft] = useState<QuestSubQuest | null>(
    null,
  );
  const [editingSubquestId, setEditingSubquestId] = useState<string | null>(
    null,
  );
  const [lessonDraft, setLessonDraft] = useState("");
  const [lessonOpen, setLessonOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [prosDraft, setProsDraft] = useState("");
  const [consDraft, setConsDraft] = useState("");
  const [valuesOpen, setValuesOpen] = useState(false);
  const [valuesDraft, setValuesDraft] = useState("");
  const [heroDraft, setHeroDraft] = useState<HeroDraft | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [loreOpen, setLoreOpen] = useState(false);
  const [loreDraft, setLoreDraft] = useState("");
  const [scrapDraft, setScrapDraft] = useState<ScrapDraft | null>(null);
  const [attachmentDraft, setAttachmentDraft] =
    useState<AttachmentDraft | null>(null);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [locationsDraft, setLocationsDraft] = useState("");
  const [saveError, setSaveError] = useState("");
  const quest = quests[index];

  if (!quest) {
    return (
      <ScreenFrame path='wheel.app / quest' title='Quest Detail'>
        <div className='p-6'>
          <p>No quest selected.</p>
          <Button
            onClick={() => setView("screen-4")}
            className='mt-3 underline'
          >
            Choose a quest in Canon
          </Button>
        </div>
      </ScreenFrame>
    );
  }

  const id = questId(quest.id);
  const storedQuestLores = lores.filter((lore) => questId(lore.questId) === id);
  const questLores = [
    ...storedQuestLores,
    ...(quest.configuration?.lore?.trim() && !storedQuestLores.length
      ? [
          {
            id: `draft-${id}`,
            questId: id,
            details: quest.configuration.lore,
            createdAt: new Date().toISOString(),
          },
        ]
      : []),
  ].sort(
    (a, b) =>
      Date.parse(String(b.createdAt ?? "")) -
      Date.parse(String(a.createdAt ?? "")),
  );
  const parent = chapters.find(
    (chapter) =>
      chapter.id === quest.chapterId ||
      chapter.questIds?.some((value) => questId(value) === id) ||
      chapter.questIndices?.includes(index),
  );
  const emblem = emblems.find((item) =>
    emblemBelongsToQuest(item, id, quest.title),
  );
  const items = quest.configuration?.subQuests ?? [];
  const points = items.reduce((sum, item) => sum + item.points, 0);
  const completedPoints = items.reduce(
    (sum, item) => sum + (item.done ? item.points : 0),
    0,
  );
  const completedCount = items.filter((item) => item.done).length;
  const progress =
    quest.status === "COMPLETED"
      ? 100
      : points
        ? Math.round((completedPoints / points) * 100)
        : 0;
  const moralValues = quest.moralValues ?? [];
  const lesson = quest.lessonLearned;
  const pros = quest.pros ?? [];
  const cons = quest.cons ?? [];
  const rating = Math.max(0, Math.min(5, quest.rating ?? 0));
  const hasLore = questLores.length > 0;
  const hasSubquests = items.length > 0;
  const hasNotes = hasRichText(quest.notes);
  const hasValues = moralValues.length > 0;
  const hasLesson = Boolean(lesson?.lesson.trim());
  const hasReflection = pros.length > 0 || cons.length > 0;
  const hasScraps = Boolean(quest.images?.length);
  const hasArtifacts = Boolean(quest.artifacts?.length);
  const hasKeepsakes = Boolean(quest.keepsakes?.length);
  const hasLocations = Boolean(quest.locations?.length);

  async function persistQuest(values: Record<string, unknown>) {
    setSaveError("");
    setActionLoading(
      String(values.status).toLowerCase() === "completed"
        ? "Sealing the Quest…"
        : "Updating the Quest…",
    );
    const response = await updateQuest(id, values);
    setActionLoading(null);
    if (response.status !== 200) {
      setSaveError(
        response.data instanceof Error
          ? response.data.message
          : "Could not save this component.",
      );
      return false;
    }
    return true;
  }

  async function updateSubquest(subquestId: string, patch: { done?: boolean }) {
    const previous = items.find((item) => item.id === subquestId);
    setQuests((previous) =>
      previous.map((entry, position) =>
        position === index && entry.configuration
          ? {
              ...entry,
              configuration: {
                ...entry.configuration,
                subQuests: entry.configuration.subQuests.map((item) =>
                  item.id === subquestId ? { ...item, ...patch } : item,
                ),
              },
            }
          : entry,
      ),
    );
    if (patch.done === undefined) return;
    setActionLoading("Writing it into the Wheel…");
    const response = await updateQuestChild(id, "subquests", subquestId, {
      status: patch.done ? "done" : "active",
      updatedAt: new Date().toISOString(),
    });
    setActionLoading(null);
    if (response.status >= 400 || response.data instanceof Error) {
      if (previous) {
        setQuests((entries) =>
          entries.map((entry, position) =>
            position === index && entry.configuration
              ? {
                  ...entry,
                  configuration: {
                    ...entry.configuration,
                    subQuests: entry.configuration.subQuests.map((item) =>
                      item.id === subquestId ? previous : item,
                    ),
                  },
                }
              : entry,
          ),
        );
      }
      setSaveError(
        response.data instanceof Error
          ? response.data.message
          : "Could not update the side quest.",
      );
    }
  }

  function removeSubquest(subquestId: string) {
    setQuests((previous) =>
      previous.map((entry, position) =>
        position === index && entry.configuration
          ? {
              ...entry,
              configuration: {
                ...entry.configuration,
                subQuests: entry.configuration.subQuests.filter(
                  (item) => item.id !== subquestId,
                ),
              },
            }
          : entry,
      ),
    );
  }

  async function saveSubquest() {
    if (!subquestDraft?.title.trim()) return;
    const now = new Date().toISOString();
    const payload = {
      title: subquestDraft.title.trim(),
      description: subquestDraft.note.trim(),
      dueAt: subquestDraft.dueDate
        ? endOfKualaLumpurDay(subquestDraft.dueDate)
        : null,
      mode: subquestDraft.mode?.trim() || "",
      priority: subquestDraft.priority ?? "low",
      status: subquestDraft.done ? "done" : "active",
      updatedAt: now,
    };
    setSaveError("");
    setActionLoading("Writing it into the Wheel…");
    const response = editingSubquestId
      ? await updateQuestChild(id, "subquests", editingSubquestId, payload)
      : await createQuestChild(id, "subquests", {
          ...payload,
          createdAt: now,
        });
    setActionLoading(null);
    const expectedStatus = editingSubquestId ? 200 : 201;
    if (response.status !== expectedStatus || response.data instanceof Error) {
      setSaveError(
        response.data instanceof Error
          ? response.data.message
          : "Could not save the side quest.",
      );
      return;
    }
    const savedDraft = {
      ...subquestDraft,
      id: editingSubquestId ?? String((response.data as FirebaseRecord).id),
    };
    setQuests((previous) =>
      previous.map((entry, position) => {
        if (position !== index) return entry;
        const configuration = entry.configuration ?? {
          tags: [],
          components: ["Side quest"],
          subQuests: [],
          rating: 0,
          notes: "",
          pros: "",
          cons: "",
          moralValues: "",
          lessonLearned: "",
          lore: "",
          scraps: [],
        };
        const exists = configuration.subQuests.some(
          (item) => item.id === savedDraft.id,
        );
        return {
          ...entry,
          configuration: {
            ...configuration,
            subQuests: exists
              ? configuration.subQuests.map((item) =>
                  item.id === savedDraft.id ? savedDraft : item,
                )
              : [...configuration.subQuests, savedDraft],
          },
        };
      }),
    );
    setSubquestDraft(null);
    setEditingSubquestId(null);
  }

  async function saveHero() {
    if (!heroDraft?.title.trim()) return;
    const locations = heroDraft.locations
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const tags = heroDraft.tags
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (
      !(await persistQuest({
        title: heroDraft.title.trim(),
        subtitle: heroDraft.subtitle.trim(),
        dueAt: heroDraft.dueDate
          ? endOfKualaLumpurDay(heroDraft.dueDate)
          : null,
        rating: heroDraft.rating,
        description: heroDraft.description.trim(),
        locations,
        tags,
        updatedAt: new Date().toISOString(),
      }))
    )
      return;
    setQuests((previous) =>
      previous.map((entry, position) =>
        position === index
          ? {
              ...entry,
              title: heroDraft.title.trim(),
              subtitle: heroDraft.subtitle.trim(),
              dueDate: heroDraft.dueDate,
              rating: heroDraft.rating,
              description: heroDraft.description.trim(),
              note: heroDraft.description.trim(),
              locations,
              tags,
            }
          : entry,
      ),
    );
    setHeroDraft(null);
  }

  return (
    <ScreenFrame
      path={`wheel.app / ${questDetailOrigin === "screen-1" ? "chapter" : "canon"} / quest`}
      title={`Quest - ${quest.title}`}
    >
      <div className='p-6 md:p-8 space-y-8'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <Button
            onClick={() => setView(questDetailOrigin)}
            className='text-sm text-wheel-navy'
          >
            ← Back to{" "}
            {questDetailOrigin === "screen-1" ? "Chapter Details" : "Canon"}
          </Button>
          {parent ? (
            <div className='flex items-center gap-3'>
              <span className='font-serif italic text-sm text-wheel-slate'>
                Part of:
              </span>
              <Badge className='rounded-md border border-wheel-sand bg-wheel-parchment px-3 py-1.5 font-mono text-sm text-wheel-ink'>
                Chapter: {parent.name}
              </Badge>
            </div>
          ) : (
            <div className='flex items-center'>
              <span className='font-serif italic text-sm text-wheel-slate'>
                Ideas/Seeds
              </span>
            </div>
          )}
        </div>

        <Card className='bg-gradient-to-r from-wheel-navy via-[#1C2C3F] to-wheel-midnight text-wheel-cream rounded-2xl p-6 border border-wheel-navy'>
          <div className='flex flex-wrap justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-3'>
              <Badge className='inline-block bg-wheel-gold text-wheel-navy rounded px-3 py-1.5 text-base font-mono uppercase tracking-wider'>
                {quest.subtitle || "Untitled Quest"}
              </Badge>
              <Badge
                className={`quest-status-badge inline-block rounded border px-3 py-1.5 text-base font-mono uppercase tracking-wider ${quest.status === "ACTIVE" || quest.status === "ONGOING" ? "quest-status-badge-active" : "quest-status-badge-default"}`}
              >
                {quest.status}
              </Badge>
              {quest.dueDate && (
                <span className='font-mono text-base text-wheel-sand'>
                  🗓 Due {shortDate(quest.dueDate)}
                </span>
              )}
              <span className='font-mono text-sm text-wheel-sand'>
                <span className='text-wheel-gold'>
                  {rating ? "★".repeat(rating) : "☆".repeat(5)}
                </span>{" "}
                (
                {rating ? `${rating}/5 ${ratingLabels[rating]}` : "Rate it now"}
                )
              </span>
            </div>
            {!!quest.tags?.length && (
              <span className='font-serif italic text-sm text-wheel-sand capitalize'>
                {quest.tags.join(" / ")}
              </span>
            )}
          </div>
          <div
            className={`mt-3 grid gap-6 ${emblem ? "md:grid-cols-[minmax(0,1fr)_240px]" : "grid-cols-1"}`}
          >
            <div className='min-w-0'>
              <div className='flex items-center gap-3'>
                <h2 className='font-serif text-3xl font-bold break-words'>
                  {quest.title}
                </h2>
                <Button
                  aria-label='Edit quest details'
                  onClick={() =>
                    setHeroDraft({
                      title: quest.title,
                      subtitle: quest.subtitle ?? "",
                      dueDate: kualaLumpurDate(quest.dueDate ?? ""),
                      rating,
                      description: quest.description ?? quest.note,
                      locations: (quest.locations ?? []).join(", "),
                      tags: (quest.tags ?? []).join(", "),
                    })
                  }
                  className='shrink-0 rounded-md p-2 text-wheel-sand hover:bg-white/10 hover:text-wheel-cream'
                >
                  <ActionIcon />
                </Button>
              </div>
              <p className='text-sm mt-3 whitespace-pre-wrap text-wheel-cream/80'>
                {quest.description || quest.note}
              </p>
              {!!quest.locations?.length && (
                <p className='mt-5 border-t border-wheel-cream/15 pt-4 text-sm font-mono text-wheel-sand'>
                  📍 {quest.locations.join(" • ")}
                </p>
              )}
            </div>
            {emblem && (
              <div className='quest-emblem-panel self-center rounded-xl border p-4 text-center'>
                <span className='block text-3xl' aria-hidden='true'>
                  {String(emblem.icon || "✦")}
                </span>
                <p className='mt-2 font-mono text-sm font-bold text-wheel-gold'>
                  {String(emblem.name || "Emblem")}
                </p>
                {emblem.title && (
                  <p className='mt-1 font-serif text-sm italic text-wheel-sand'>
                    {String(emblem.title)}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {(!hasLore ||
          !hasSubquests ||
          !hasNotes ||
          !hasValues ||
          !hasLesson ||
          !hasReflection ||
          !hasScraps ||
          !hasArtifacts ||
          !hasKeepsakes ||
          !hasLocations) && (
          <Card className='rounded-xl border border-dashed border-wheel-sand bg-wheel-parchment/60 p-4'>
            <div className='flex flex-wrap items-center gap-3'>
              <span className='font-serif text-sm font-bold text-wheel-ink'>
                Add components
              </span>
              {!hasLore && (
                <Button
                  onClick={() => {
                    setLoreDraft("");
                    setLoreOpen(true);
                  }}
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Lore
                </Button>
              )}
              {!hasSubquests && (
                <Button
                  onClick={() => {
                    setEditingSubquestId(null);
                    setSubquestDraft({
                      id: crypto.randomUUID(),
                      title: "",
                      note: "",
                      dueDate: "",
                      points: 1,
                      done: false,
                      mode: "",
                      priority: "low",
                    });
                  }}
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Side Quest
                </Button>
              )}
              {!hasNotes && (
                <Button
                  onClick={() => {
                    setNotesDraft("");
                    setNotesOpen(true);
                  }}
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Notes
                </Button>
              )}
              {!hasValues && (
                <Button
                  onClick={() => {
                    setValuesDraft("");
                    setValuesOpen(true);
                  }}
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Moral Values
                </Button>
              )}
              {!hasLesson && (
                <Button
                  onClick={() => {
                    setLessonDraft("");
                    setLessonOpen(true);
                  }}
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Lesson Learned
                </Button>
              )}
              {!hasReflection && (
                <Button
                  onClick={() => {
                    setProsDraft("");
                    setConsDraft("");
                    setReflectionOpen(true);
                  }}
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Pros &amp; Cons
                </Button>
              )}
              {!hasScraps && (
                <Button
                  onClick={() => setScrapDraft({ url: "", caption: "" })}
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Scraps
                </Button>
              )}
              {!hasArtifacts && (
                <Button
                  onClick={() =>
                    setAttachmentDraft({
                      kind: "artifact",
                      url: "",
                      caption: "",
                    })
                  }
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Artifacts
                </Button>
              )}
              {!hasKeepsakes && (
                <Button
                  onClick={() =>
                    setAttachmentDraft({
                      kind: "keepsake",
                      url: "",
                      caption: "",
                    })
                  }
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Keepsakes
                </Button>
              )}
              {!hasLocations && (
                <Button
                  onClick={() => {
                    setLocationsDraft("");
                    setLocationsOpen(true);
                  }}
                  className='rounded-full border border-wheel-sand bg-white px-3 py-1.5 text-base font-mono text-wheel-slate'
                >
                  + Locations
                </Button>
              )}
            </div>
            {saveError && (
              <p role='alert' className='mt-3 text-base text-wheel-terracotta'>
                {saveError}
              </p>
            )}
          </Card>
        )}

        {hasLore && (
          <Card className='rounded-2xl border border-wheel-border bg-white p-5 shadow-paper'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <h3 className='font-serif text-xl font-bold'>📖 Lore</h3>
              <Button
                onClick={() => {
                  setLoreDraft("");
                  setLoreOpen(true);
                }}
                className='rounded-full border border-wheel-sand bg-wheel-parchment px-3 py-1.5 text-sm font-serif italic text-wheel-slate'
              >
                + Add Lore
              </Button>
            </div>
            <div className='custom-scrollbar mt-4 h-52 space-y-4 overflow-y-auto pr-3'>
              {questLores.map((lore) => (
                <article
                  key={lore.id}
                  className='border-l-2 border-wheel-sage pl-4'
                >
                  <p className='text-base font-mono text-wheel-slate'>
                    {loreDate(lore.createdAt)}
                    {quest.title ? ` • ${quest.title}` : ""}
                  </p>
                  <p className='mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wheel-ink'>
                    {String(lore.details ?? lore.description ?? "")}
                  </p>
                </article>
              ))}
            </div>
          </Card>
        )}

        {hasSubquests && (
          <Card className='grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] items-center gap-6 bg-white border border-wheel-border rounded-xl p-5 shadow-paper'>
            <div>
              <div className='flex flex-wrap items-center gap-3'>
                <h3 className='font-serif text-lg font-bold'>
                  Quest Progress (Weighted)
                </h3>
                <Badge className='rounded-md bg-rose-50 px-3 py-1 font-mono text-sm font-bold text-wheel-terracotta'>
                  {progress}% Completed
                </Badge>
              </div>
              <p className='mt-1 text-sm text-wheel-slate'>
                Difficulty points:{" "}
                <strong className='text-wheel-ink'>
                  Critical (5pt), Hard (3pt), Medium (2pt), Easy (1pt).
                </strong>{" "}
                Completing heavier challenges advances the quest faster.
              </p>
            </div>
            <div className='h-3 rounded-full bg-wheel-parchment overflow-hidden'>
              <ProgressBar value={progress} />
            </div>
          </Card>
        )}

        {hasSubquests && (
          <section>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div className='flex flex-wrap items-baseline gap-3'>
                <h3 className='font-serif text-xl font-bold'>
                  Side Quests (Sub-Challenges)
                </h3>
                <span className='font-mono text-sm text-wheel-slate'>
                  {completedCount} of {items.length} finished •{" "}
                  {completedPoints}/{points} pts
                </span>
              </div>
              <Button
                onClick={() => {
                  setEditingSubquestId(null);
                  setSubquestDraft({
                    id: crypto.randomUUID(),
                    title: "",
                    note: "",
                    dueDate: "",
                    points: 1,
                    done: false,
                    mode: "",
                    priority: "low",
                  });
                }}
                className='rounded-lg border border-wheel-border bg-wheel-parchment px-4 py-2 text-sm font-semibold shadow-sm'
              >
                + Add Side Quest
              </Button>
            </div>

            <div className='mt-4 space-y-3'>
              {items.map((item) => {
                const level = difficulty[item.points] ?? difficulty[1];
                return (
                  <Card
                    key={item.id}
                    className='flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 rounded-xl border border-wheel-border bg-white p-4 shadow-sm'
                  >
                    <label className='flex min-w-0 flex-1 items-center gap-4 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={item.done}
                        onChange={() =>
                          void updateSubquest(item.id, { done: !item.done })
                        }
                        className='h-5 w-5 shrink-0 accent-blue-600'
                      />
                      <span className='min-w-0'>
                        <span
                          className={`block text-sm font-medium ${item.done ? "line-through text-wheel-slate" : ""}`}
                        >
                          {item.title}
                        </span>
                        {item.note && (
                          <span className='block mt-1 text-base font-serif italic text-wheel-slate'>
                            {item.note}
                          </span>
                        )}
                        {(item.mode || item.dueDate) && (
                          <span className='block mt-1 text-base font-mono text-wheel-slate capitalize'>
                            {[
                              item.mode,
                              item.dueDate
                                ? `Due ${shortDate(item.dueDate)}`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        )}
                      </span>
                    </label>
                    <div className='flex shrink-0 items-center gap-3'>
                      <Badge
                        className={`rounded-md border px-3 py-1 text-[11px] font-mono font-bold ${level.color}`}
                      >
                        {level.label} ({item.points}{" "}
                        {item.points === 1 ? "PT" : "PTS"})
                      </Badge>
                      <div className='flex items-center gap-1 border-l border-wheel-border pl-2'>
                        <Button
                          aria-label={`Edit ${item.title}`}
                          onClick={() => {
                            setEditingSubquestId(item.id);
                            setSubquestDraft({
                              ...item,
                              priority:
                                item.priority ||
                                (
                                  {
                                    1: "low",
                                    2: "medium",
                                    3: "high",
                                    5: "critical",
                                  } as Record<number, string>
                                )[item.points],
                            });
                          }}
                          className='rounded p-2 text-wheel-slate hover:bg-wheel-parchment'
                        >
                          <ActionIcon />
                        </Button>
                        <Button
                          aria-label={`Delete ${item.title}`}
                          onClick={() => removeSubquest(item.id)}
                          className='rounded p-2 text-wheel-slate hover:bg-rose-50 hover:text-wheel-terracotta'
                        >
                          <ActionIcon remove />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {hasNotes && (
          <Card className='flex h-80 flex-col rounded-xl border border-wheel-border bg-white p-5 shadow-paper'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <h3 className='font-serif text-xl font-bold'>Notes</h3>
              <Button
                onClick={() => {
                  setNotesDraft(quest.notes ?? "");
                  setNotesOpen(true);
                }}
                className='font-serif italic text-sm text-wheel-terracotta'
              >
                {quest.notes ? "Edit Notes" : "+ Add Notes"}
              </Button>
            </div>
            <div
              className='mt-4 min-h-0 flex-1 overflow-y-auto pr-2 text-base leading-relaxed text-wheel-slate [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-wheel-gold [&_blockquote]:pl-3 [&_pre]:rounded [&_pre]:bg-wheel-parchment [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5'
              onClick={(event) => {
                const target = event.target;
                if (!(target instanceof Element)) return;
                const link = target.closest("a");
                if (!(link instanceof HTMLAnchorElement)) return;
                event.preventDefault();
                window.open(link.href, "_blank", "noopener,noreferrer");
              }}
              dangerouslySetInnerHTML={{ __html: quest.notes ?? "" }}
            />
          </Card>
        )}

        {(hasValues || hasLesson) && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
            {hasValues && (
              <Card className='rounded-xl border border-wheel-border bg-white p-5 shadow-paper'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <h3 className='font-serif text-lg font-bold'>
                    ✧ Nilai Murni (Moral Values)
                  </h3>
                  <span className='text-base font-mono uppercase tracking-wider text-wheel-sage'>
                    Reflective
                  </span>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  {moralValues.map((value) => (
                    <Badge
                      key={value}
                      className='rounded-full border border-wheel-sage/30 bg-wheel-sageLight px-3 py-1.5 text-sm text-wheel-sage'
                    >
                      🌱 {value}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    setValuesDraft(moralValues.join(", "));
                    setValuesOpen(true);
                  }}
                  className='mt-4 rounded-full border border-wheel-sand bg-wheel-parchment px-3 py-1.5 text-sm font-serif italic text-wheel-slate'
                >
                  + Add value tag
                </Button>
              </Card>
            )}

            {hasLesson && (
              <Card className='rounded-xl border border-wheel-border bg-white p-5 shadow-paper'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <h3 className='font-serif text-lg font-bold text-wheel-ink'>
                    ⌁ Pengajaran (Lessons Learned)
                  </h3>
                  <span className='text-base font-mono text-wheel-slate'>
                    Archive
                  </span>
                </div>
                {lesson && (
                  <>
                    <blockquote className='mt-4 text-sm leading-relaxed text-wheel-slate'>
                      “{lesson.lesson}”
                    </blockquote>
                    {lessonDate(lesson.createdAt) && (
                      <p className='mt-4 text-right font-hand text-lg text-wheel-terracotta'>
                        — noted on {lessonDate(lesson.createdAt)}
                      </p>
                    )}
                    <div className='mt-4 flex justify-end gap-3'>
                      <Button
                        onClick={() => {
                          setLessonDraft(lesson.lesson);
                          setLessonOpen(true);
                        }}
                        className='font-serif italic text-sm text-wheel-terracotta'
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() =>
                          setQuests((previous) =>
                            previous.map((entry, position) =>
                              position === index
                                ? { ...entry, lessonLearned: undefined }
                                : entry,
                            ),
                          )
                        }
                        className='font-serif italic text-sm text-wheel-slate'
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        )}

        {hasReflection && (
          <Card className='grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)_auto] items-start gap-4 rounded-xl border border-wheel-border bg-wheel-parchment p-5'>
            <h3 className='font-serif font-bold'>⚖️ Pros &amp; Cons Module:</h3>
            <p className='text-sm text-wheel-slate'>
              {pros.length} {pros.length === 1 ? "Pro" : "Pros"}
              {pros.length ? ` (${pros.join(", ")})` : ""} / {cons.length}{" "}
              {cons.length === 1 ? "Con" : "Cons"}
              {cons.length ? ` (${cons.join(", ")})` : ""}
            </p>
            <Button
              onClick={() => {
                setProsDraft(pros.join("\n"));
                setConsDraft(cons.join("\n"));
                setReflectionOpen(true);
              }}
              className='font-serif italic text-sm text-wheel-terracotta'
            >
              Edit Reflection
            </Button>
          </Card>
        )}

        {hasArtifacts && (
          <section aria-labelledby='artifacts-heading'>
            <div className='flex flex-wrap items-end justify-between gap-3'>
              <div>
                <p className='text-base font-mono uppercase tracking-wider text-wheel-sage'>
                  Things made along the way
                </p>
                <h3
                  id='artifacts-heading'
                  className='mt-1 font-serif text-2xl font-bold'
                >
                  Artifacts
                </h3>
              </div>
              <Button
                onClick={() =>
                  setAttachmentDraft({ kind: "artifact", url: "", caption: "" })
                }
                className='rounded-full border border-wheel-sand bg-wheel-parchment px-3 py-1.5 text-sm font-serif italic text-wheel-slate'
              >
                + Add Artifact
              </Button>
            </div>
            <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
              {(quest.artifacts ?? []).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target='_blank'
                  rel='noreferrer'
                  className='group rounded-xl border border-wheel-border bg-white p-4 shadow-paper hover:border-wheel-gold'
                >
                  <p className='font-serif font-bold text-wheel-ink'>
                    {item.caption || "Untitled Artifact"}
                  </p>
                  <p className='mt-2 truncate text-base text-wheel-sage'>
                    Open link →
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}
        {hasKeepsakes && (
          <section aria-labelledby='keepsakes-heading'>
            <div className='flex flex-wrap items-end justify-between gap-3'>
              <div>
                <p className='text-base font-mono uppercase tracking-wider text-wheel-sage'>
                  Things worth remembering
                </p>
                <h3
                  id='keepsakes-heading'
                  className='mt-1 font-serif text-2xl font-bold'
                >
                  Keepsakes
                </h3>
              </div>
              <Button
                onClick={() =>
                  setAttachmentDraft({ kind: "keepsake", url: "", caption: "" })
                }
                className='rounded-full border border-wheel-sand bg-wheel-parchment px-3 py-1.5 text-sm font-serif italic text-wheel-slate'
              >
                + Add Keepsake
              </Button>
            </div>
            <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
              {(quest.keepsakes ?? []).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target='_blank'
                  rel='noreferrer'
                  className='group rounded-xl border border-wheel-border bg-white p-4 shadow-paper hover:border-wheel-gold'
                >
                  <p className='font-serif font-bold text-wheel-ink'>
                    {item.caption || "Untitled Keepsake"}
                  </p>
                  <p className='mt-2 truncate text-base text-wheel-sage'>
                    Open link →
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}
        {hasScraps && (
          <section aria-labelledby='scraps-heading'>
            <div className='flex flex-wrap items-end justify-between gap-3'>
              <div>
                <p className='text-base font-mono uppercase tracking-wider text-wheel-sage'>
                  Visual keepsakes
                </p>
                <h3
                  id='scraps-heading'
                  className='mt-1 font-serif text-2xl font-bold'
                >
                  Scraps
                </h3>
              </div>
              <div className='flex items-center gap-3'>
                <span className='font-mono text-base text-wheel-slate'>
                  {quest.images?.length ?? 0}{" "}
                  {(quest.images?.length ?? 0) === 1 ? "image" : "images"}
                </span>
                <Button
                  onClick={() => setScrapDraft({ url: "", caption: "" })}
                  className='rounded-full border border-wheel-sand bg-wheel-parchment px-3 py-1.5 text-sm font-serif italic text-wheel-slate'
                >
                  + Add Scrap
                </Button>
              </div>
            </div>
            <div className='mt-4 grid auto-rows-[90px] grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
              {(quest.images ?? []).map((image, imageIndex) => (
                <figure
                  key={image.id}
                  className={`group relative overflow-hidden rounded-lg border-4 border-white bg-wheel-parchment shadow-scrapbook ${imageIndex % 5 === 0 ? "col-span-2 row-span-3 -rotate-1" : imageIndex % 3 === 0 ? "row-span-3 rotate-1" : "row-span-2"}`}
                >
                  <div
                    role='img'
                    aria-label={
                      image.caption || `Quest scrap ${imageIndex + 1}`
                    }
                    className='absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105'
                    style={{
                      backgroundImage: `url(${JSON.stringify(image.url)})`,
                    }}
                  />
                  {image.caption && (
                    <figcaption className='absolute inset-x-0 bottom-0 bg-wheel-midnight/80 px-3 py-2 text-base font-serif italic text-wheel-cream backdrop-blur-sm'>
                      {image.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal
        open={heroDraft !== null}
        onClose={() => setHeroDraft(null)}
        title='Edit Quest'
      >
        {heroDraft && (
          <form
            className='rounded-2xl bg-wheel-cream p-6 space-y-4'
            onSubmit={(event) => {
              event.preventDefault();
              saveHero();
            }}
          >
            <h2 className='font-serif text-xl font-bold'>Edit Quest Details</h2>
            <label className='block text-sm font-mono'>
              Title
              <input
                autoFocus
                required
                value={heroDraft.title}
                onChange={(event) =>
                  setHeroDraft({ ...heroDraft, title: event.target.value })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Subtitle
              <input
                value={heroDraft.subtitle}
                onChange={(event) =>
                  setHeroDraft({ ...heroDraft, subtitle: event.target.value })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Due date
              <input
                type='date'
                value={heroDraft.dueDate}
                onChange={(event) =>
                  setHeroDraft({ ...heroDraft, dueDate: event.target.value })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Rating
              <select
                value={heroDraft.rating}
                onChange={(event) =>
                  setHeroDraft({
                    ...heroDraft,
                    rating: Number(event.target.value),
                  })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              >
                <option value={0}>No rating</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} — {ratingLabels[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className='block text-sm font-mono'>
              Description
              <textarea
                rows={4}
                value={heroDraft.description}
                onChange={(event) =>
                  setHeroDraft({
                    ...heroDraft,
                    description: event.target.value,
                  })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Locations
              <span className='block mt-1 text-base font-sans text-wheel-slate'>
                Separate entries with commas.
              </span>
              <input
                value={heroDraft.locations}
                onChange={(event) =>
                  setHeroDraft({ ...heroDraft, locations: event.target.value })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Tags
              <span className='block mt-1 text-base font-sans text-wheel-slate'>
                Separate entries with commas.
              </span>
              <input
                value={heroDraft.tags}
                onChange={(event) =>
                  setHeroDraft({ ...heroDraft, tags: event.target.value })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <div className='flex justify-end gap-3'>
              <Button onClick={() => setHeroDraft(null)}>Cancel</Button>
              <Button
                type='submit'
                className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
              >
                Save Quest
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        title='Edit Notes'
      >
        <form
          className='rounded-2xl bg-wheel-cream p-6 space-y-4'
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              !hasRichText(notesDraft) ||
              !(await persistQuest({
                notes: notesDraft,
                updatedAt: new Date().toISOString(),
              }))
            )
              return;
            setQuests((previous) =>
              previous.map((entry, position) =>
                position === index ? { ...entry, notes: notesDraft } : entry,
              ),
            );
            setNotesOpen(false);
          }}
        >
          <h2 className='font-serif text-xl font-bold'>Quest Notes</h2>
          <RichTextEditor
            key={notesOpen ? "open" : "closed"}
            value={notesDraft}
            onChange={setNotesDraft}
          />
          <div className='flex justify-end gap-3'>
            <Button onClick={() => setNotesOpen(false)}>Cancel</Button>
            <Button
              type='submit'
              className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
            >
              Save Notes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={loreOpen}
        onClose={() => setLoreOpen(false)}
        title='Add Lore'
      >
        <form
          className='rounded-2xl bg-wheel-cream p-6 space-y-4'
          onSubmit={async (event) => {
            event.preventDefault();
            if (!loreDraft.trim()) return;
            setActionLoading("Adding to the Lore…");
            const response = await createLore({
              questId: id,
              details: loreDraft.trim(),
              createdAt: new Date().toISOString(),
            });
            setActionLoading(null);
            if (response.status !== 201) {
              setSaveError("Could not save the lore entry.");
              return;
            }
            setLoreDraft("");
            setLoreOpen(false);
          }}
        >
          <div>
            <h2 className='font-serif text-xl font-bold'>Add Lore</h2>
            <p className='mt-1 text-sm text-wheel-slate'>
              Capture a moment, realization, or story from this quest.
            </p>
          </div>
          <label className='block text-sm font-mono'>
            Lore
            <textarea
              autoFocus
              required
              rows={6}
              value={loreDraft}
              onChange={(event) => setLoreDraft(event.target.value)}
              className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
            />
          </label>
          <div className='flex justify-end gap-3'>
            <Button onClick={() => setLoreOpen(false)}>Cancel</Button>
            <Button
              type='submit'
              className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
            >
              Add Lore
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={locationsOpen}
        onClose={() => setLocationsOpen(false)}
        title='Add Locations'
      >
        <form
          className='rounded-2xl bg-wheel-cream p-6 space-y-4'
          onSubmit={async (event) => {
            event.preventDefault();
            const locations = locationsDraft
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean);
            if (
              !locations.length ||
              !(await persistQuest({
                locations,
                updatedAt: new Date().toISOString(),
              }))
            )
              return;
            setQuests((previous) =>
              previous.map((entry, position) =>
                position === index ? { ...entry, locations } : entry,
              ),
            );
            setLocationsOpen(false);
          }}
        >
          <div>
            <h2 className='font-serif text-xl font-bold'>Add Locations</h2>
            <p className='mt-1 text-sm text-wheel-slate'>
              Separate multiple locations with commas.
            </p>
          </div>
          <label className='block text-sm font-mono'>
            Locations
            <input
              autoFocus
              required
              value={locationsDraft}
              onChange={(event) => setLocationsDraft(event.target.value)}
              placeholder='Kuala Lumpur, Penang'
              className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
            />
          </label>
          <div className='flex justify-end gap-3'>
            <Button onClick={() => setLocationsOpen(false)}>Cancel</Button>
            <Button
              type='submit'
              className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
            >
              Save Locations
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={attachmentDraft !== null}
        onClose={() => setAttachmentDraft(null)}
        title={
          attachmentDraft?.kind === "keepsake" ? "Add Keepsake" : "Add Artifact"
        }
      >
        {attachmentDraft && (
          <form
            className='rounded-2xl bg-wheel-cream p-6 space-y-4'
            onSubmit={async (event) => {
              event.preventDefault();
              if (!/^https?:\/\//i.test(attachmentDraft.url.trim())) {
                setSaveError("Enter a valid URL.");
                return;
              }
              setActionLoading("Writing it into the Wheel…");
              const collection =
                attachmentDraft.kind === "artifact" ? "artifacts" : "keepsakes";
              const createdAt = new Date().toISOString();
              const response = await createQuestChild(id, collection, {
                url: attachmentDraft.url.trim(),
                caption: attachmentDraft.caption.trim(),
                createdAt,
              });
              setActionLoading(null);
              if (response.status !== 201) {
                setSaveError("Could not save this entry.");
                return;
              }
              const saved = {
                id: String((response.data as FirebaseRecord).id),
                url: attachmentDraft.url.trim(),
                caption: attachmentDraft.caption.trim() || undefined,
                createdAt,
                kind: attachmentDraft.kind,
              };
              setQuests((previous) =>
                previous.map((entry, position) =>
                  position === index
                    ? {
                        ...entry,
                        [collection]: [...(entry[collection] ?? []), saved],
                      }
                    : entry,
                ),
              );
              setAttachmentDraft(null);
            }}
          >
            <h2 className='font-serif text-xl font-bold'>
              Add{" "}
              {attachmentDraft.kind === "artifact" ? "Artifact" : "Keepsake"}
            </h2>
            <label className='block text-sm font-mono'>
              URL
              <input
                autoFocus
                required
                type='url'
                value={attachmentDraft.url}
                onChange={(event) =>
                  setAttachmentDraft({
                    ...attachmentDraft,
                    url: event.target.value,
                  })
                }
                className='mt-2 block w-full rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Caption
              <input
                value={attachmentDraft.caption}
                onChange={(event) =>
                  setAttachmentDraft({
                    ...attachmentDraft,
                    caption: event.target.value,
                  })
                }
                className='mt-2 block w-full rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <div className='flex justify-end gap-3'>
              <Button onClick={() => setAttachmentDraft(null)}>Cancel</Button>
              <Button
                type='submit'
                className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
              >
                Add{" "}
                {attachmentDraft.kind === "artifact" ? "Artifact" : "Keepsake"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={scrapDraft !== null}
        onClose={() => setScrapDraft(null)}
        title='Add Scrap'
      >
        {scrapDraft && (
          <form
            className='rounded-2xl bg-wheel-cream p-6 space-y-4'
            onSubmit={async (event) => {
              event.preventDefault();
              if (!/^https?:\/\//i.test(scrapDraft.url.trim())) {
                setSaveError("Enter a valid image URL.");
                return;
              }
              const createdAt = new Date().toISOString();
              setActionLoading("Adding to the Scraps…");
              const response = await createQuestChild(id, "images", {
                url: scrapDraft.url.trim(),
                caption: scrapDraft.caption.trim(),
                sourceType: "quest",
                createdAt,
              });
              setActionLoading(null);
              if (response.status !== 201) {
                setSaveError("Could not save the scrap.");
                return;
              }
              const image = {
                id: String((response.data as FirebaseRecord).id),
                url: scrapDraft.url.trim(),
                caption: scrapDraft.caption.trim() || undefined,
                sourceType: "quest",
                createdAt,
              };
              setQuests((previous) =>
                previous.map((entry, position) =>
                  position === index
                    ? { ...entry, images: [...(entry.images ?? []), image] }
                    : entry,
                ),
              );
              setScrapDraft(null);
            }}
          >
            <div>
              <h2 className='font-serif text-xl font-bold'>Add Scrap</h2>
              <p className='mt-1 text-sm text-wheel-slate'>
                Add an image URL and an optional caption to the collage.
              </p>
            </div>
            <label className='block text-sm font-mono'>
              Image URL
              <input
                autoFocus
                required
                type='url'
                value={scrapDraft.url}
                onChange={(event) =>
                  setScrapDraft({ ...scrapDraft, url: event.target.value })
                }
                placeholder='https://…'
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Caption (optional)
              <input
                value={scrapDraft.caption}
                onChange={(event) =>
                  setScrapDraft({ ...scrapDraft, caption: event.target.value })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <div className='flex justify-end gap-3'>
              <Button onClick={() => setScrapDraft(null)}>Cancel</Button>
              <Button
                type='submit'
                className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
              >
                Add Scrap
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={subquestDraft !== null}
        onClose={() => {
          setSubquestDraft(null);
          setEditingSubquestId(null);
        }}
        title={editingSubquestId ? "Edit Side Quest" : "Add Side Quest"}
      >
        {subquestDraft && (
          <form
            className='rounded-2xl bg-wheel-cream p-6 space-y-4'
            onSubmit={(event) => {
              event.preventDefault();
              saveSubquest();
            }}
          >
            <h2 className='font-serif text-xl font-bold'>
              {editingSubquestId ? "Edit Side Quest" : "Add Side Quest"}
            </h2>
            <label className='block text-sm font-mono'>
              Title
              <input
                autoFocus
                required
                value={subquestDraft.title}
                onChange={(event) =>
                  setSubquestDraft({
                    ...subquestDraft,
                    title: event.target.value,
                  })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Description (optional)
              <input
                value={subquestDraft.note}
                onChange={(event) =>
                  setSubquestDraft({
                    ...subquestDraft,
                    note: event.target.value,
                  })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Mode (optional)
              <input
                value={subquestDraft.mode ?? ""}
                onChange={(event) =>
                  setSubquestDraft({
                    ...subquestDraft,
                    mode: event.target.value,
                  })
                }
                placeholder='e.g. Online'
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <label className='block text-sm font-mono'>
              Due date (optional)
              <input
                type='date'
                value={subquestDraft.dueDate}
                onChange={(event) =>
                  setSubquestDraft({
                    ...subquestDraft,
                    dueDate: event.target.value,
                  })
                }
                className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <fieldset>
              <legend className='text-sm font-mono mb-2'>
                Difficulty &amp; Impact Weight
              </legend>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                {[
                  { priority: "low", points: 1, label: "EASY" },
                  { priority: "medium", points: 2, label: "MEDIUM" },
                  { priority: "high", points: 3, label: "HARD" },
                  { priority: "critical", points: 5, label: "CRITICAL" },
                ].map((option) => (
                  <label
                    key={option.priority}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-sm cursor-pointer ${subquestDraft.priority === option.priority ? difficulty[option.points].color : "border-wheel-sand bg-white"}`}
                  >
                    <input
                      type='radio'
                      name='subquest-priority'
                      checked={subquestDraft.priority === option.priority}
                      onChange={() =>
                        setSubquestDraft({
                          ...subquestDraft,
                          priority: option.priority,
                          points: option.points,
                        })
                      }
                    />
                    {option.label} ({option.points}{" "}
                    {option.points === 1 ? "pt" : "pts"})
                  </label>
                ))}
              </div>
            </fieldset>
            <div className='flex justify-end gap-3'>
              <Button
                onClick={() => {
                  setSubquestDraft(null);
                  setEditingSubquestId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
              >
                Save Side Quest
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={lessonOpen}
        onClose={() => setLessonOpen(false)}
        title='Add Lesson Learned'
      >
        <form
          className='rounded-2xl bg-wheel-cream p-6 space-y-4'
          onSubmit={async (event) => {
            event.preventDefault();
            if (!lessonDraft.trim()) return;
            const lessonValue = {
              lesson: lessonDraft.trim(),
              createdAt: lesson?.createdAt ?? new Date().toISOString(),
            };
            if (
              !(await persistQuest({
                lesson_learned: lessonValue,
                updatedAt: new Date().toISOString(),
              }))
            )
              return;
            setQuests((previous) =>
              previous.map((entry, position) =>
                position === index
                  ? {
                      ...entry,
                      lessonLearned: lessonValue,
                    }
                  : entry,
              ),
            );
            setLessonOpen(false);
          }}
        >
          <h2 className='font-serif text-xl font-bold'>
            {lesson ? "Edit" : "Add"} Lesson Learned
          </h2>
          <label className='block text-sm font-mono'>
            Lesson
            <textarea
              autoFocus
              required
              rows={5}
              value={lessonDraft}
              onChange={(event) => setLessonDraft(event.target.value)}
              className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
            />
          </label>
          <div className='flex justify-end gap-3'>
            <Button onClick={() => setLessonOpen(false)}>Cancel</Button>
            <Button
              type='submit'
              className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
            >
              {lesson ? "Save Lesson" : "Add Lesson"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={valuesOpen}
        onClose={() => setValuesOpen(false)}
        title='Moral Values'
      >
        <form
          className='rounded-2xl bg-wheel-cream p-6 space-y-4'
          onSubmit={async (event) => {
            event.preventDefault();
            const values = valuesDraft
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean);
            if (
              !values.length ||
              !(await persistQuest({
                moral_values: values,
                updatedAt: new Date().toISOString(),
              }))
            )
              return;
            setQuests((previous) =>
              previous.map((entry, position) =>
                position === index ? { ...entry, moralValues: values } : entry,
              ),
            );
            setValuesOpen(false);
          }}
        >
          <div>
            <h2 className='font-serif text-xl font-bold'>Add Moral Values</h2>
            <p className='mt-1 text-sm text-wheel-slate'>
              Every entries can be separated by commas
            </p>
          </div>
          <label className='block text-sm font-mono'>
            Values
            <textarea
              autoFocus
              rows={4}
              value={valuesDraft}
              onChange={(event) => setValuesDraft(event.target.value)}
              placeholder='Courage to Explore, Community Stewardship'
              className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
            />
          </label>
          <div className='flex justify-end gap-3'>
            <Button onClick={() => setValuesOpen(false)}>Cancel</Button>
            <Button
              type='submit'
              className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
            >
              Save Values
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={reflectionOpen}
        onClose={() => setReflectionOpen(false)}
        title='Edit Reflection'
      >
        <form
          className='rounded-2xl bg-wheel-cream p-6 space-y-4'
          onSubmit={async (event) => {
            event.preventDefault();
            const nextPros = prosDraft.trim() ? [prosDraft.trim()] : [];
            const nextCons = consDraft.trim() ? [consDraft.trim()] : [];
            if (
              (!nextPros.length && !nextCons.length) ||
              !(await persistQuest({
                pros: nextPros,
                cons: nextCons,
                updatedAt: new Date().toISOString(),
              }))
            )
              return;
            setQuests((previous) =>
              previous.map((entry, position) =>
                position === index
                  ? {
                      ...entry,
                      pros: nextPros,
                      cons: nextCons,
                    }
                  : entry,
              ),
            );
            setReflectionOpen(false);
          }}
        >
          <h2 className='font-serif text-xl font-bold'>Edit Pros &amp; Cons</h2>
          <label className='block text-sm font-mono'>
            Pros
            <textarea
              rows={4}
              value={prosDraft}
              onChange={(event) => setProsDraft(event.target.value)}
              className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
            />
          </label>
          <label className='block text-sm font-mono'>
            Cons
            <textarea
              rows={4}
              value={consDraft}
              onChange={(event) => setConsDraft(event.target.value)}
              className='block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2'
            />
          </label>
          <div className='flex justify-end gap-3'>
            <Button onClick={() => setReflectionOpen(false)}>Cancel</Button>
            <Button
              type='submit'
              className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
            >
              Save Reflection
            </Button>
          </div>
        </form>
      </Modal>
    </ScreenFrame>
  );
}
