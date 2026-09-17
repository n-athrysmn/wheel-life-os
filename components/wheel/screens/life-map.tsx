import type { QuestSubQuest } from "../../helpers/quest-definition";
import type { ChapterRecord } from "../../helpers/workspace-data";
import { Button, Badge, Card, ScreenFrame } from "../ui";
import { useWheel } from "../wheel-provider";
import { useState } from "react";

const filters = [
  "All",
  "In Chronicle",
  "Future",
  "Ideas / Seeds",
  "Published",
] as const;
type CanonFilter = (typeof filters)[number];

function questId(value: unknown) {
  return (
    String(value ?? "")
      .split("/")
      .at(-1) ?? ""
  );
}

function chapterForQuest(
  chapters: ChapterRecord[],
  id: string,
  chapterId: string | undefined,
  index: number,
) {
  return chapters.find(
    (chapter) =>
      chapter.id === chapterId ||
      chapter.questIds?.some((value) => questId(value) === id) ||
      chapter.questIndices?.includes(index),
  );
}

function canonGroup(
  status: string,
  chapter?: ChapterRecord,
): Exclude<CanonFilter, "All"> {
  if (status.toLowerCase() === "completed") return "Published";
  if (!chapter) return "Ideas / Seeds";
  if (chapter.status?.toLowerCase() === "upcoming") return "Future";
  return "In Chronicle";
}

function nearestSubquest(items: QuestSubQuest[]) {
  const ongoing = items.filter((item) => !item.done);
  const nearestOngoing = ongoing
    .filter((item) => item.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  if (nearestOngoing) return nearestOngoing;
  if (ongoing.length) return ongoing[0];

  return items
    .filter((item) => item.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
}

function deadlineValue(dueDate?: string, subquest?: QuestSubQuest) {
  const values = [dueDate, subquest?.dueDate]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  return values.length ? Math.min(...values) : Number.POSITIVE_INFINITY;
}

function shortDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
      }).format(date);
}

function questBorder(
  status: string,
  group: Exclude<CanonFilter, "All">,
  chapter: ChapterRecord | undefined,
  dueDate: string | undefined,
  now: number,
) {
  if (group === "Published") return "border-0";
  if (group === "Ideas / Seeds") return "border border-[#687384]";
  if (status.toLowerCase() !== "active") return "border border-wheel-border";

  if (dueDate) {
    const due = new Date(`${dueDate.slice(0, 10)}T23:59:59`).getTime();
    if (Number.isFinite(due) && due < now) {
      const daysOverdue = Math.ceil((now - due) / 86_400_000);
      return daysOverdue > 7
        ? "border-2 border-[#BB4D48]"
        : "border-2 border-[#B48740]";
    }
  }

  if (chapter?.status?.toLowerCase() === "ongoing")
    return "border-2 border-[#4D7A69]";
  if (chapter?.status?.toLowerCase() === "upcoming")
    return "border-2 border-[#476E99]";
  return "border border-wheel-border";
}

function questAccent(
  status: string,
  group: Exclude<CanonFilter, "All">,
  chapter: ChapterRecord | undefined,
  dueDate: string | undefined,
  now: number,
) {
  if (group === "Published") return "text-wheel-slate";
  if (group === "Ideas / Seeds") return "text-[#687384]";
  if (status.toLowerCase() !== "active") return "text-wheel-slate";
  if (dueDate) {
    const due = new Date(`${dueDate.slice(0, 10)}T23:59:59`).getTime();
    if (Number.isFinite(due) && due < now) {
      return Math.ceil((now - due) / 86_400_000) > 7
        ? "text-[#BB4D48]"
        : "text-[#B48740]";
    }
  }
  if (chapter?.status?.toLowerCase() === "ongoing") return "text-[#4D7A69]";
  if (chapter?.status?.toLowerCase() === "upcoming") return "text-[#476E99]";
  return "text-wheel-slate";
}

export function LifeMap() {
  const {
    quests,
    chapters,
    selected,
    setSelected,
    openCreateChapter,
    openQuest,
    setView,
    mapFilter,
    setMapFilter,
  } = useWheel();
  const [now] = useState(() => Date.now());

  const entries = quests.map((quest, index) => {
    const id = questId(quest.id);
    const chapter = chapterForQuest(chapters, id, quest.chapterId, index);
    const group = canonGroup(quest.status, chapter);
    const next = nearestSubquest(quest.configuration?.subQuests ?? []);
    const activeChapter = chapter?.status?.toLowerCase() === "ongoing";
    return {
      quest,
      index,
      chapter,
      group,
      next,
      activeChapter,
      deadline: deadlineValue(quest.dueDate, next),
    };
  });

  const counts = Object.fromEntries(
    filters.map((filter) => [
      filter,
      filter === "All"
        ? entries.length
        : entries.filter((entry) => entry.group === filter).length,
    ]),
  );
  const visible = entries
    .filter((entry) => mapFilter === "All" || entry.group === mapFilter)
    .sort(
      (a, b) =>
        Number(b.activeChapter) - Number(a.activeChapter) ||
        a.deadline - b.deadline ||
        a.quest.title.localeCompare(b.quest.title),
    );

  return (
    <ScreenFrame path='wheel.app / canon' title='Canon'>
      <div className='p-6 md:p-8 space-y-7'>
        <header className='grid grid-cols-1 items-start gap-6 lg:grid-cols-2'>
          <div className='max-w-2xl'>
            <Badge className='inline-flex rounded-full border border-wheel-sand bg-wheel-parchment px-3 py-1 text-base font-mono text-wheel-slate'>
              🧭 The Cartography of Possibilities
            </Badge>
            <div className='mt-2 flex flex-wrap items-center justify-between gap-3'>
              <h2 className='font-serif text-3xl font-bold'>Canon</h2>
              <Button
                onClick={() => setView("screen-7")}
                className='rounded-lg border border-wheel-sage bg-wheel-sageLight px-4 py-2 font-mono text-base font-bold text-wheel-sage shadow-sm hover:bg-wheel-sage hover:text-white'
              >
                + Quest
              </Button>
            </div>
            <p className='text-sm text-wheel-slate mt-1'>
              Every destination you’ve conceived. An archipelago of futures.
            </p>
          </div>
          <nav
            aria-label='Canon filters'
            className='flex flex-wrap gap-2 lg:justify-self-end'
          >
            {filters.map((value) => (
              <Button
                key={value}
                aria-pressed={mapFilter === value}
                onClick={() => setMapFilter(value)}
                className={`rounded-xl border px-4 py-2 text-sm font-mono ${mapFilter === value ? "bg-wheel-navy text-wheel-cream border-wheel-navy" : "bg-white text-wheel-slate border-wheel-sand"}`}
              >
                {value} ({counts[value] ?? 0})
              </Button>
            ))}
          </nav>
        </header>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          {visible.map(
            ({ quest, index, chapter, group, next, activeChapter }) => {
              const accent = questAccent(
                quest.status,
                group,
                chapter,
                quest.dueDate,
                now,
              );
              return (
                <Card
                  key={quest.id || index}
                  className={`flex h-full min-w-0 flex-col break-words rounded-2xl bg-white p-5 shadow-paper ${questBorder(quest.status, group, chapter, quest.dueDate, now)}`}
                >
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <Badge
                      className={`rounded-md border border-current bg-transparent px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider ${accent}`}
                    >
                      {quest.subtitle || group}
                    </Badge>
                    {!!quest.tags?.length && (
                      <span className='font-serif italic text-sm text-wheel-slate capitalize'>
                        {quest.tags.join(" / ")}
                      </span>
                    )}
                  </div>
                  <h3 className='font-serif text-xl font-bold mt-4'>
                    {quest.title}
                  </h3>
                  <p className='text-sm text-wheel-slate mt-2 whitespace-pre-wrap line-clamp-2'>
                    {quest.description || quest.note}
                  </p>
                  {next && (
                    <div className='mt-4 flex items-center justify-between gap-4 rounded-xl border border-wheel-border bg-wheel-parchmentLight px-4 py-3'>
                      <div className='min-w-0'>
                        <p className='font-serif font-bold text-sm'>
                          {next.title}
                        </p>
                        <p className='mt-1 text-base font-mono text-wheel-slate capitalize'>
                          {[next.mode, shortDate(next.dueDate)]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                      {(next.done || next.priority) && (
                        <Badge
                          className={`shrink-0 rounded-md border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider ${next.done ? "border-wheel-sage bg-wheel-sageLight text-wheel-sage" : "border-dashed border-wheel-terracotta text-wheel-terracotta"}`}
                        >
                          {next.done ? "Done" : `Priority: ${next.priority}`}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className='mt-auto pt-5'>
                    <div className='flex flex-wrap items-center justify-between gap-3 border-t border-wheel-border pt-4'>
                      <span className='font-serif italic text-sm text-wheel-slate'>
                        {activeChapter ? "In Current Chronicle" : group}
                      </span>
                      <div className='flex items-center gap-4'>
                        <Button
                          onClick={() => openQuest(index, "screen-4")}
                          className={`text-sm font-semibold ${accent}`}
                        >
                          Open Quest →
                        </Button>
                        {!chapter && group !== "Published" && (
                          <Button
                            className='text-base text-wheel-slate'
                            onClick={() => {
                              const id =
                                String(quest.id ?? index)
                                  .split("/")
                                  .at(-1) || String(index);
                              if (!selected.includes(id))
                                setSelected([...selected, id]);
                              openCreateChapter(true);
                            }}
                          >
                            + Add to Next Chapter
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            },
          )}
        </div>

        {!visible.length && (
          <p className='bg-wheel-parchment border border-dashed border-wheel-sand rounded-xl p-6 text-center text-wheel-slate'>
            No quests in this view.
          </p>
        )}

        <Button
          onClick={() => setView("screen-5")}
          className='w-full text-left bg-wheel-navy text-wheel-cream border border-wheel-gold/40 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3 shadow-card-lift'
        >
          <span>
            <strong className='font-serif text-lg'>
              🏛️ Hall of Emblems Cabinet
            </strong>
            <span className='block text-base italic text-wheel-sand mt-1'>
              View the dedicated velvet archive & medallion chronicles
            </span>
          </span>
          <span className='text-sm font-mono text-wheel-gold'>
            Enter Hall →
          </span>
        </Button>
      </div>
    </ScreenFrame>
  );
}
