import { useMemo, useState } from "react";
import { Badge, Button, Card, ProgressBar, ScreenFrame } from "../ui";
import { useWheel } from "../wheel-provider";
import type {
  ChapterRecord,
  ChronicleRecord,
} from "../../helpers/workspace-data";
import { CreateChapter } from "./create-chapter";

type Filter = "all" | "current" | "upcoming" | "mastered";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(date);
}
function statusOf(chapter: ChapterRecord) {
  return chapter.status?.toLowerCase() ?? "planned";
}
function isDone(chapter: ChapterRecord) {
  return ["done", "completed", "published", "mastered"].includes(
    statusOf(chapter),
  );
}
function progressOf(chapter: ChapterRecord, now: number) {
  const start = Date.parse(chapter.start);
  const end = Date.parse(chapter.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return isDone(chapter) ? 100 : 0;
  return Math.max(
    0,
    Math.min(100, Math.round(((now - start) / (end - start)) * 100)),
  );
}
function parentsFor(chapter: ChapterRecord, chronicles: ChronicleRecord[]) {
  const chapterId = String(chapter.id).split("/").at(-1);
  return chronicles.filter((chronicle) => {
    const explicitlyMapped = chronicle.chapterIds.some(
      (id) => String(id).split("/").at(-1) === chapterId,
    );
    const overlapsDates =
      chapter.start.slice(0, 10) <= chronicle.end.slice(0, 10) &&
      chapter.end.slice(0, 10) >= chronicle.start.slice(0, 10);
    return explicitlyMapped || overlapsDates;
  });
}
function chapterNumber(chapter: ChapterRecord, chapters: ChapterRecord[]) {
  const ordered = [...chapters].sort(
    (a, b) => Date.parse(a.start) - Date.parse(b.start),
  );
  return ordered.findIndex((item) => item.id === chapter.id) + 1;
}

export function ChapterIndex() {
  const {
    chapters,
    chronicles,
    creatingChapter,
    closeChapterEditor,
    openCreateChapter,
    openChapter,
    setView,
  } = useWheel();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [now] = useState(() => Date.now());
  const counts = {
    all: chapters.length,
    current: chapters.filter((item) => statusOf(item) === "ongoing").length,
    upcoming: chapters.filter((item) => statusOf(item) === "upcoming").length,
    mastered: chapters.filter(isDone).length,
  };
  const visible = useMemo(
    () =>
      [...chapters]
        .filter((chapter) => {
          const status = statusOf(chapter);
          const matchesFilter =
            filter === "all" ||
            (filter === "current" && status === "ongoing") ||
            (filter === "upcoming" && status === "upcoming") ||
            (filter === "mastered" && isDone(chapter));
          const parents = parentsFor(chapter, chronicles);
          const term = search.trim().toLowerCase();
          return (
            matchesFilter &&
            (!term ||
              [
                chapter.name,
                chapter.intention,
                ...parents.flatMap((parent) => [parent.title, parent.subtitle]),
              ].some((value) => value?.toLowerCase().includes(term)))
          );
        })
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start)),
    [chapters, chronicles, filter, search],
  );

  if (creatingChapter)
    return (
      <div className='space-y-4'>
        <Button
          onClick={closeChapterEditor}
          className='font-serif text-sm text-wheel-navy'
        >
          ← All Chapters
        </Button>
        <CreateChapter />
      </div>
    );

  return (
    <ScreenFrame path='wheel.app / chronicles / chapters' title='Chapters'>
      <div className='space-y-6 p-6 md:p-8'>
        <header className='flex flex-wrap items-start justify-between gap-5 border-b border-wheel-border pb-7'>
          <div>
            <p className='font-mono text-base uppercase tracking-[.18em] text-wheel-sage'>
              Execution sprints &amp; runs
            </p>
            <h2 className='mt-1 font-serif text-4xl font-bold'>Chapters</h2>
            <p className='mt-2 max-w-2xl text-sm text-wheel-slate'>
              Every discrete run of execution mapped across your chronicles.
              Track live chapter momentum, milestone deliverables, and
              historical cadences.
            </p>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Button
              onClick={() => openCreateChapter()}
              className='rounded-xl border border-wheel-sage bg-wheel-sageLight px-4 py-2 text-sm text-wheel-sage'
            >
              ＋ New Chapter
            </Button>
            <Button
              onClick={() => setView("screen-3")}
              className='rounded-xl border border-wheel-border px-4 py-2 text-sm text-wheel-slate'
            >
              ← View Chronicles
            </Button>
          </div>
        </header>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex flex-wrap rounded-xl border border-wheel-border bg-wheel-parchment/50 p-1'>
            {(["all", "current", "upcoming", "mastered"] as Filter[]).map(
              (item) => (
                <Button
                  key={item}
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                  className={`rounded-lg px-3 py-1.5 text-base ${filter === item ? "bg-wheel-navy text-wheel-cream" : "text-wheel-slate"}`}
                >
                  {item === "current"
                    ? "Current Runs"
                    : item === "mastered"
                      ? "Mastered"
                      : item === "all"
                        ? "All Chapters"
                        : "Upcoming"}{" "}
                  ({counts[item]})
                </Button>
              ),
            )}
          </div>
          <label className='rounded-lg border border-wheel-border bg-wheel-parchment/30 px-3 py-2 text-base text-wheel-slate'>
            ⌕{" "}
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Search chapter title or chronicle…'
              className='ml-1 bg-transparent outline-none'
            />
          </label>
        </div>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {visible.map((chapter) => {
            const parents = parentsFor(chapter, chronicles);
            const status = statusOf(chapter);
            const ongoing = status === "ongoing";
            const overdue = !isDone(chapter) && Date.parse(chapter.end) < now;
            const progress = progressOf(chapter, now);
            const number = chapterNumber(chapter, chapters);
            return (
              <Card
                key={chapter.id}
                role='button'
                tabIndex={0}
                onClick={() => openChapter(chapter.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openChapter(chapter.id);
                  }
                }}
                className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-paper transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-wheel-gold ${overdue ? "border-wheel-terracotta" : ongoing ? "border-wheel-sage" : "border-wheel-border"}`}
              >
                <div className='flex flex-wrap items-center justify-between gap-3 border-b border-wheel-border pb-3'>
                  <div className='flex items-center gap-3'>
                    <Badge className='rounded-lg border border-wheel-border bg-wheel-parchment px-2.5 py-1 font-mono text-base'>
                      Ch. {String(Math.max(1, number)).padStart(2, "0")}
                    </Badge>
                    <span className='font-mono text-[10px] text-wheel-slate'>
                      {parents.length
                        ? parents.map((parent) => parent.title).join(" • ")
                        : "Unmapped Chronicle"}
                    </span>
                  </div>
                  <div className='flex items-center gap-3 font-mono text-[10px] text-wheel-slate'>
                    <span>
                      {dateLabel(chapter.start)} – {dateLabel(chapter.end)}
                    </span>
                    <Badge
                      className={`rounded border px-2 py-1 uppercase ${overdue ? "border-wheel-terracotta text-wheel-terracotta" : ongoing ? "border-wheel-sage bg-wheel-sageLight text-wheel-sage" : "border-wheel-border"}`}
                    >
                      {overdue
                        ? "Past due"
                        : ongoing
                          ? "● Current Chapter"
                          : isDone(chapter)
                            ? "Mastered"
                            : chapter.status || "Planned"}
                    </Badge>
                  </div>
                </div>
                <div className='grid gap-4 pt-4 xl:grid-cols-[1fr_150px] xl:items-center'>
                  <div>
                    <h3 className='font-serif text-lg font-bold'>
                      {chapter.name}
                    </h3>
                    <p className='mt-1 line-clamp-2 text-base text-wheel-slate'>
                      {chapter.intention}
                    </p>
                  </div>
                  <div>
                    <div className='flex justify-between font-mono text-[10px] text-wheel-slate'>
                      <span>Progress</span>
                      <span
                        className={
                          overdue ? "text-wheel-terracotta" : "text-wheel-sage"
                        }
                      >
                        {progress}%
                      </span>
                    </div>
                    <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-wheel-parchment'>
                      <ProgressBar
                        value={progress}
                        className={`h-full rounded-full ${overdue ? "bg-wheel-terracotta" : "bg-wheel-sage"}`}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {!visible.length && (
            <Card className='rounded-xl border border-dashed border-wheel-border p-8 text-center text-wheel-slate'>
              No chapters found in this view.
            </Card>
          )}
        </div>
      </div>
    </ScreenFrame>
  );
}
