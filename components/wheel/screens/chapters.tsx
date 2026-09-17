import { useState } from "react";
import { Badge, Button, Card, ProgressBar, ScreenFrame } from "../ui";
import { useWheel } from "../wheel-provider";
import type { Quest } from "../../helpers/quest-definition";
import type {
  ChapterRecord,
  ChronicleRecord,
} from "../../helpers/workspace-data";
import { CreateChronicle } from "./create-chronicle";
import { ChronicleDossier } from "../chronicle-dossier";

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
function questsFor(chapter: ChapterRecord, quests: Quest[]) {
  if (chapter.questIds?.length) {
    const ids = new Set(
      chapter.questIds.map((id) => String(id).split("/").at(-1)),
    );
    return quests.filter((quest) =>
      ids.has(String(quest.id).split("/").at(-1)),
    );
  }
  return (chapter.questIndices ?? []).flatMap((index) =>
    quests[index] ? [quests[index]] : [],
  );
}
function chaptersFor(chronicle: ChronicleRecord, chapters: ChapterRecord[]) {
  const ids = new Set(
    chronicle.chapterIds.map((id) => String(id).split("/").at(-1)),
  );
  return chapters
    .filter((chapter) => {
      const explicitlyMapped = ids.has(String(chapter.id).split("/").at(-1));
      const overlapsDates =
        chapter.start.slice(0, 10) <= chronicle.end.slice(0, 10) &&
        chapter.end.slice(0, 10) >= chronicle.start.slice(0, 10);
      return explicitlyMapped || overlapsDates;
    })
    .sort((a, b) => {
      const byStart = Date.parse(a.start) - Date.parse(b.start);
      if (Number.isFinite(byStart) && byStart !== 0) return byStart;
      const aCreated = Date.parse(a.createdAt ?? a.start);
      const bCreated = Date.parse(b.createdAt ?? b.start);
      return (
        (Number.isFinite(aCreated) ? aCreated : 0) -
        (Number.isFinite(bCreated) ? bCreated : 0)
      );
    });
}
function timeline(chronicle: ChronicleRecord) {
  const start = new Date(chronicle.start).getTime();
  const end = new Date(chronicle.end).getTime();
  const now = Date.now();
  if (![start, end].every(Number.isFinite) || end <= start)
    return { progress: 0, remaining: 0 };
  return {
    progress: Math.max(
      0,
      Math.min(100, Math.round(((now - start) / (end - start)) * 100)),
    ),
    remaining: Math.max(0, Math.ceil((end - now) / 86400000)),
  };
}

export function Chapters() {
  const { chapters, chronicles, quests, openChapter } = useWheel();
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [editor, setEditor] = useState<ChronicleRecord | "new" | null>(null);
  const [dossier, setDossier] = useState<ChronicleRecord | null>(null);
  const [runTabs, setRunTabs] = useState<Record<string, "active" | "all">>({});
  if (editor)
    return (
      <div className='space-y-4'>
        <Button
          onClick={() => setEditor(null)}
          className='font-serif text-sm text-wheel-navy'
        >
          ← All Chronicles
        </Button>
        <CreateChronicle
          chronicle={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setFilter("all");
          }}
        />
      </div>
    );
  const active = chronicles.filter(
    (item) => item.status?.toLowerCase() === "ongoing",
  );
  const visible = (filter === "active" ? [...active] : [...chronicles]).sort(
    (a, b) => {
      const aCreated = Date.parse(a.createdAt ?? a.start);
      const bCreated = Date.parse(b.createdAt ?? b.start);
      return (
        (Number.isFinite(aCreated) ? aCreated : 0) -
        (Number.isFinite(bCreated) ? bCreated : 0)
      );
    },
  );
  return (
    <>
      <ScreenFrame path='wheel.app / chronicles' title='Chronicles'>
        <div className='space-y-7 p-6 md:p-8'>
          <header className='flex flex-wrap items-start justify-between gap-5 border-b border-wheel-border pb-7'>
            <div>
              <p className='font-mono text-base uppercase tracking-[.18em] text-wheel-sage'>
                Your unfolding story
              </p>
              <h2 className='mt-1 font-serif text-4xl font-bold'>Chronicles</h2>
              <p className='mt-2 max-w-2xl text-sm text-wheel-slate'>
                Every season of focus, kept together in one place. Curate
                intentions, measure momentum, and archive your personal
                mythology.
              </p>
            </div>
            <Button
              onClick={() => setEditor("new")}
              className='rounded-xl border border-wheel-border bg-wheel-navy px-4 py-2 text-sm text-wheel-cream'
            >
              ＋ New Chronicle
            </Button>
          </header>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <p className='font-mono text-base text-wheel-slate'>
              <span className='text-wheel-sage'>{active.length} active</span> •{" "}
              {chronicles.length} total chronicles mapped
            </p>
            <div className='flex rounded-xl border border-wheel-border bg-wheel-parchment/50 p-1'>
              <Button
                onClick={() => setFilter("active")}
                aria-pressed={filter === "active"}
                className={`rounded-lg px-3 py-1.5 text-base ${filter === "active" ? "bg-wheel-navy text-wheel-cream" : "text-wheel-slate"}`}
              >
                Active ({active.length})
              </Button>
              <Button
                onClick={() => setFilter("all")}
                aria-pressed={filter === "all"}
                className={`rounded-lg px-3 py-1.5 text-base ${filter === "all" ? "bg-wheel-navy text-wheel-cream" : "text-wheel-slate"}`}
              >
                All Timeline ({chronicles.length})
              </Button>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
            {visible.map((chronicle) => {
              const runs = chaptersFor(chronicle, chapters);
              const current = chronicle.status?.toLowerCase() === "ongoing";
              const related = runs.flatMap((chapter) =>
                questsFor(chapter, quests),
              );
              const activeQuests = related.filter((quest) =>
                ["ACTIVE", "ONGOING"].includes(quest.status),
              );
              const { progress, remaining } = timeline(chronicle);
              const runTab = runTabs[chronicle.id] ?? "active";
              const activeRuns = runs.filter(
                (chapter) =>
                  !["done", "completed", "published"].includes(
                    chapter.status?.toLowerCase() ?? "",
                  ),
              );
              const shownRuns = runTab === "active" ? activeRuns : runs;
              return (
                <Card
                  key={chronicle.id}
                  className={`relative mt-3 flex min-w-0 flex-col rounded-2xl border bg-white p-5 pt-7 shadow-paper ${current ? "border-2 border-wheel-sage" : "border-wheel-border"} ${current && filter === "active" ? "lg:col-span-2" : ""}`}
                >
                  <Badge
                    className={`absolute -top-3 left-5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider shadow-sm ${current ? "border-wheel-sage bg-wheel-sageLight text-wheel-sage" : "border-wheel-border bg-wheel-parchment text-wheel-slate"}`}
                  >
                    ●{" "}
                    {current
                      ? "Primary Chronicle"
                      : `${chronicle.status || "Archived"} Chronicle`}
                  </Badge>
                  <div className='flex flex-wrap items-center justify-between gap-3 border-b border-wheel-border pb-4 font-mono text-base text-wheel-slate'>
                    <span>
                      ▣ {dateLabel(chronicle.start)} –{" "}
                      {dateLabel(chronicle.end)}
                    </span>
                    {current && (
                      <Badge className='rounded border border-wheel-sage/30 bg-wheel-sageLight px-2 py-1 text-wheel-sage'>
                        {remaining} days left
                      </Badge>
                    )}
                  </div>
                  <div className='py-5'>
                    <h3 className='font-serif text-2xl font-bold'>
                      {chronicle.title}
                    </h3>
                    {chronicle.subtitle && (
                      <p className='mt-1 font-mono text-base uppercase tracking-wider text-wheel-sage'>
                        {chronicle.subtitle}
                      </p>
                    )}
                    <p className='mt-2 min-h-10 font-serif italic text-wheel-slate'>
                      “{chronicle.description}”
                    </p>
                    <div className='mt-5 flex items-center justify-between font-mono text-[10px] text-wheel-slate'>
                      <span>Chronicle Progress</span>
                      <span className='text-wheel-sage'>
                        {progress}% elapsed
                      </span>
                    </div>
                    <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-wheel-parchment'>
                      <ProgressBar value={progress} />
                    </div>
                    <div className='mt-4 grid grid-cols-2 gap-3'>
                      <div className='rounded-xl border border-wheel-border bg-wheel-parchment/30 p-3'>
                        <strong className='block text-sm'>
                          {runs.length}{" "}
                          {runs.length === 1 ? "Chapter" : "Chapters"}
                        </strong>
                        <span className='text-base text-wheel-slate'>
                          Across this chronicle
                        </span>
                      </div>
                      <div className='rounded-xl border border-wheel-border bg-wheel-parchment/30 p-3'>
                        <strong className='block text-sm'>
                          {activeQuests.length} Active{" "}
                          {activeQuests.length === 1 ? "Quest" : "Quests"}
                        </strong>
                        <span className='text-base text-wheel-slate'>
                          {related.length} total stories
                        </span>
                      </div>
                    </div>
                  </div>
                  <section className='border-t border-wheel-border pt-4 text-base text-wheel-slate'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-mono text-sm text-wheel-ink'>
                          ⌄ Runs of Chapters
                        </h4>
                        <Badge className='rounded bg-wheel-sageLight px-2 py-1 font-mono text-[10px] text-wheel-sage'>
                          {runs.length} Chapters Mapped
                        </Badge>
                      </div>
                      <div className='flex items-center gap-3 font-mono text-[10px]'>
                        <Button
                          onClick={() =>
                            setRunTabs((items) => ({
                              ...items,
                              [chronicle.id]: "active",
                            }))
                          }
                          aria-pressed={runTab === "active"}
                          className={
                            runTab === "active"
                              ? "text-wheel-sage underline underline-offset-4"
                              : "text-wheel-slate"
                          }
                        >
                          Active Chapters
                        </Button>
                        <Button
                          onClick={() =>
                            setRunTabs((items) => ({
                              ...items,
                              [chronicle.id]: "all",
                            }))
                          }
                          aria-pressed={runTab === "all"}
                          className={
                            runTab === "all"
                              ? "text-wheel-sage underline underline-offset-4"
                              : "text-wheel-slate"
                          }
                        >
                          All Chapters
                        </Button>
                      </div>
                    </div>
                    <div className='mt-4 space-y-3 border-l border-wheel-sage/60 pl-4'>
                      {shownRuns.map((chapter, index) => {
                        const status =
                          chapter.status?.toLowerCase() ?? "planned";
                        const overdue =
                          !["done", "completed", "published"].includes(
                            status,
                          ) && Date.parse(chapter.end) < Date.now();
                        const ongoing = status === "ongoing";
                        return (
                          <div
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
                            className={`flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-xl border bg-wheel-parchment/20 px-4 py-3 transition-colors hover:bg-wheel-parchment/60 focus:outline-none focus:ring-2 focus:ring-wheel-gold ${overdue ? "border-wheel-terracotta" : ongoing ? "border-wheel-sage" : "border-wheel-border"}`}
                          >
                            <div className='flex min-w-0 items-center gap-3'>
                              <Badge
                                className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] ${overdue ? "border-wheel-terracotta text-wheel-terracotta" : ongoing ? "border-wheel-sage bg-wheel-sageLight text-wheel-sage" : "border-wheel-border text-wheel-slate"}`}
                              >
                                CH. {String(index + 1).padStart(2, "0")}
                              </Badge>
                              <div className='min-w-0'>
                                <strong className='block truncate text-sm text-wheel-ink'>
                                  {chapter.name}
                                </strong>
                                <span className='font-mono text-[10px]'>
                                  {dateLabel(chapter.start)} –{" "}
                                  {dateLabel(chapter.end)}
                                </span>
                              </div>
                            </div>
                            <Badge
                              className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] uppercase ${overdue ? "border-wheel-terracotta text-wheel-terracotta" : ongoing ? "border-wheel-sage bg-wheel-sageLight text-wheel-sage" : "border-wheel-border text-wheel-slate"}`}
                            >
                              {overdue
                                ? "Past due"
                                : ongoing
                                  ? "● Current Chapter"
                                  : chapter.status || "Planned"}
                            </Badge>
                          </div>
                        );
                      })}
                      {!shownRuns.length && (
                        <p className='rounded-xl border border-dashed border-wheel-border p-4 text-center'>
                          {runTab === "active"
                            ? "No active chapters in this chronicle."
                            : "No chapters mapped to this chronicle."}
                        </p>
                      )}
                    </div>
                  </section>
                  <div className='mt-auto flex flex-wrap items-center justify-between gap-3 pt-5'>
                    {current ? (
                      <Button
                        onClick={() => setDossier(chronicle)}
                        className='font-serif text-sm text-wheel-sage'
                      >
                        Open Chronicle &amp; Dossier →
                      </Button>
                    ) : (
                      <span className='font-serif text-sm italic text-wheel-slate'>
                        Archived with care
                      </span>
                    )}
                    <Button
                      onClick={() => setEditor(chronicle)}
                      className='font-serif text-sm text-wheel-slate'
                    >
                      Amend the Chronicle ✎
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
          {!visible.length && (
            <Card className='rounded-xl border border-dashed border-wheel-sand bg-wheel-parchment p-8 text-center text-wheel-slate'>
              No chronicles found in this view.
            </Card>
          )}
        </div>
      </ScreenFrame>
      <ChronicleDossier
        chronicle={dossier}
        chapters={chapters}
        quests={quests}
        onClose={() => setDossier(null)}
        onOpenChapter={(id) => {
          setDossier(null);
          openChapter(id);
        }}
      />
    </>
  );
}
