import type { Quest } from "../helpers/quest-definition";
import type { ChapterRecord, ChronicleRecord } from "../helpers/workspace-data";
import { Modal } from "./modal";
import { Badge, Button } from "./ui";

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

function chapterQuests(chapter: ChapterRecord, quests: Quest[]) {
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

function questProgress(quest: Quest) {
  if (["COMPLETED", "DONE", "PUBLISHED"].includes(quest.status)) return 100;
  const sideQuests = quest.configuration?.subQuests ?? [];
  const total = sideQuests.reduce((sum, item) => sum + item.points, 0);
  if (!total) return 0;
  const completed = sideQuests.reduce(
    (sum, item) => sum + (item.done ? item.points : 0),
    0,
  );
  return Math.round((completed / total) * 100);
}

export function ChronicleDossier({
  chronicle,
  chapters,
  quests,
  onClose,
  onOpenChapter,
}: {
  chronicle: ChronicleRecord | null;
  chapters: ChapterRecord[];
  quests: Quest[];
  onClose: () => void;
  onOpenChapter: (id: string) => void;
}) {
  const runs = chronicle
    ? chapters
        .filter((chapter) => {
          const mapped = chronicle.chapterIds.some(
            (id) =>
              String(id).split("/").at(-1) ===
              String(chapter.id).split("/").at(-1),
          );
          const overlaps =
            chapter.start.slice(0, 10) <= chronicle.end.slice(0, 10) &&
            chapter.end.slice(0, 10) >= chronicle.start.slice(0, 10);
          return mapped || overlaps;
        })
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    : [];
  const related = [
    ...new Map(
      runs
        .flatMap((chapter) => chapterQuests(chapter, quests))
        .map((quest) => [String(quest.id), quest]),
    ).values(),
  ];
  const sti = related.length
    ? Math.round(
        related.reduce((sum, quest) => sum + questProgress(quest), 0) /
          related.length,
      )
    : 0;
  const duration = chronicle
    ? Math.max(
        1,
        Math.ceil(
          (Date.parse(chronicle.end) - Date.parse(chronicle.start)) /
            86_400_000,
        ) + 1,
      )
    : 0;
  const intentions = runs.filter((chapter) => chapter.intention.trim());

  return (
    <Modal
      open={chronicle !== null}
      onClose={onClose}
      title='Chronicle Dossier'
      size='wide'
    >
      {chronicle && (
        <article className='custom-scrollbar max-h-[88dvh] overflow-y-auto rounded-2xl border border-wheel-border bg-wheel-card p-6 text-wheel-ink shadow-card-lift md:p-10'>
          <header className='flex items-start justify-between gap-5 border-b border-wheel-border pb-7'>
            <div>
              <p className='font-mono text-base uppercase tracking-[.18em] text-wheel-sage'>
                Current Chronicle Dossier
              </p>
              <h2 className='mt-2 font-serif text-3xl text-wheel-ink md:text-4xl'>
                {chronicle.title}
              </h2>
              {chronicle.description && (
                <p className='mt-3 font-serif text-lg italic text-wheel-slate'>
                  “{chronicle.description}”
                </p>
              )}
            </div>
            <Button
              aria-label='Close dossier'
              onClick={onClose}
              className='rounded-lg px-3 py-1 text-2xl font-light text-wheel-slate hover:bg-wheel-parchment hover:text-wheel-ink'
            >
              ×
            </Button>
          </header>

          <div className='mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='rounded-2xl border border-wheel-border bg-wheel-parchment/40 p-4'>
              <span className='block font-mono text-base text-wheel-slate'>
                Duration
              </span>
              <strong className='mt-2 block font-mono text-sm text-wheel-ink'>
                {duration} Days
              </strong>
            </div>
            <div className='rounded-2xl border border-wheel-border bg-wheel-parchment/40 p-4'>
              <span className='block font-mono text-base text-wheel-slate'>
                STI Rating
              </span>
              <strong className='mt-2 block font-mono text-sm text-wheel-sage'>
                {sti}% {sti >= 70 ? "On Track" : "In Progress"}
              </strong>
            </div>
            <div className='rounded-2xl border border-wheel-border bg-wheel-parchment/40 p-4'>
              <span className='block font-mono text-base text-wheel-slate'>
                Cadence
              </span>
              <strong className='mt-2 block font-mono text-sm text-wheel-ink'>
                {runs.length}{" "}
                {runs.length === 1 ? "Chapter Run" : "Chapter Runs"}
              </strong>
            </div>
          </div>

          <section className='mt-8'>
            <h3 className='font-mono text-base font-bold uppercase tracking-[.16em] text-wheel-slate'>
              Pillars of Execution
            </h3>
            <div className='mt-4 space-y-3'>
              {intentions.map((chapter) => (
                <p
                  key={chapter.id}
                  className='text-sm leading-relaxed text-wheel-slate'
                >
                  <span className='mr-3 text-wheel-sage'>✓</span>
                  <strong className='text-wheel-ink'>
                    {chapter.name}:
                  </strong>{" "}
                  {chapter.intention}
                </p>
              ))}
              {!intentions.length && (
                <p className='text-sm italic text-wheel-slate'>
                  No chapter intentions have been recorded yet.
                </p>
              )}
            </div>
          </section>

          <section className='mt-9'>
            <h3 className='font-mono text-base font-bold uppercase tracking-[.16em] text-wheel-slate'>
              Runs of Chapters
            </h3>
            <div className='mt-4 space-y-3'>
              {runs.map((chapter, index) => {
                const status = chapter.status?.toLowerCase() ?? "planned";
                const active = status === "ongoing";
                const chapterSti = (() => {
                  const linked = chapterQuests(chapter, quests);
                  return linked.length
                    ? Math.round(
                        linked.reduce(
                          (sum, quest) => sum + questProgress(quest),
                          0,
                        ) / linked.length,
                      )
                    : 0;
                })();
                return (
                  <Button
                    key={chapter.id}
                    onClick={() => onOpenChapter(chapter.id)}
                    className='flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border border-wheel-border bg-wheel-parchment/30 px-4 py-4 text-left hover:border-wheel-sage hover:bg-wheel-parchment/60'
                  >
                    <span>
                      <strong className='block text-sm text-wheel-ink'>
                        Chapter {String(index + 1).padStart(2, "0")}:{" "}
                        {chapter.name}
                      </strong>
                      <span className='mt-1 block font-mono text-base text-wheel-slate'>
                        {dateLabel(chapter.start)} – {dateLabel(chapter.end)} •
                        STI {chapterSti}%
                      </span>
                    </span>
                    <Badge
                      className={`rounded-md px-3 py-1 font-mono text-base capitalize ${active ? "bg-wheel-sageLight text-wheel-sage" : "bg-wheel-parchment text-wheel-slate"}`}
                    >
                      {active ? "Active" : status}
                    </Badge>
                  </Button>
                );
              })}
              {!runs.length && (
                <p className='rounded-xl border border-dashed border-wheel-border p-5 text-center text-sm text-wheel-slate'>
                  No chapters are mapped to this chronicle.
                </p>
              )}
            </div>
          </section>

          <footer className='mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-wheel-border pt-6'>
            <span className='font-mono text-base text-wheel-slate'>
              ID: {chronicle.id}
            </span>
            <Button
              onClick={onClose}
              className='rounded-xl bg-wheel-navy px-5 py-2 text-sm text-wheel-cream hover:bg-wheel-ink'
            >
              Dismiss
            </Button>
          </footer>
        </article>
      )}
    </Modal>
  );
}
