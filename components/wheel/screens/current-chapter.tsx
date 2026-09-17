import { Button, Badge, Card, ScreenFrame } from "../ui";
import { useWheel } from "../wheel-provider";
import {
  buildDeadlines,
  daysUntil,
  millisecondsUntil,
  radarDate,
} from "../../helpers/deadlines";
function loreDate(value: unknown) {
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) return "";
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][date.getMonth()];
  return `${String(date.getDate()).padStart(2, "0")} ${month} ${date.getFullYear()}`;
}
function shortDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function chapterRange(start: string, end: string) {
  const endDate = new Date(end);
  const year = Number.isFinite(endDate.getTime())
    ? `, ${endDate.getFullYear()}`
    : "";
  return `${shortDate(start)} – ${shortDate(end)}${year}`;
}
function questProgress(quest: ReturnType<typeof useWheel>["quests"][number]) {
  if (quest.status === "COMPLETED") return 100;
  const items = quest.configuration?.subQuests ?? [];
  const total = items.reduce((sum, item) => sum + item.points, 0);
  const complete = items.reduce(
    (sum, item) => sum + (item.done ? item.points : 0),
    0,
  );
  return total ? Math.round((complete / total) * 100) : 0;
}
export function CurrentChapter() {
  const {
    chapters,
    currentChapterId,
    quests,
    openEditCurrentChapter,
    openQuest,
    setView,
    lores,
    emblems,
  } = useWheel();
  const record = chapters.find((item) => item.id === currentChapterId);
  if (!record) return null;
  const chapter = record;
  const linkedIds = new Set(
    (record.questIds ?? []).map((id) => String(id).split("/").at(-1)),
  );
  const legacyIndices = new Set(record.questIndices ?? []);
  const indices = quests.flatMap((quest, index) => {
    const id = String(quest.id ?? "")
      .split("/")
      .at(-1);
    return linkedIds.has(id) ||
      legacyIndices.has(index) ||
      quest.chapterId === currentChapterId
      ? [index]
      : [];
  });
  const start = Date.parse(chapter.start),
    end = Date.parse(chapter.end),
    today = Date.parse(radarDate);
  const duration = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const elapsed = Math.max(
    0,
    Math.min(duration, Math.round((today - start) / 86400000) + 1),
  );
  const journey =
    Number.isFinite(duration) && Number.isFinite(elapsed)
      ? Math.round((elapsed / duration) * 100)
      : 0;
  const selectedQuests = indices.flatMap((index) =>
    quests[index] ? [quests[index]] : [],
  );
  const upcoming = buildDeadlines([], [], selectedQuests).filter(
    (item) => !item.done && Number.isFinite(Date.parse(item.dueDate)),
  );
  const closingSoon = upcoming.filter((item) => {
    const remaining = millisecondsUntil(item.dueDate);
    return remaining >= 0 && remaining < 72 * 60 * 60 * 1000;
  }).length;
  const questIds = new Set(
    selectedQuests.map((quest) => String(quest.id).split("/").at(-1)),
  );
  const configuredLores = selectedQuests.flatMap((quest) =>
    quest.configuration?.lore?.trim()
      ? [
          {
            id: `draft-${quest.id}`,
            questId: quest.id,
            details: quest.configuration.lore,
            description: "",
            createdAt: "",
          },
        ]
      : [],
  );
  const recentLores = [...lores, ...configuredLores]
    .filter((lore) => questIds.has(String(lore.questId).split("/").at(-1)))
    .sort(
      (a, b) =>
        Date.parse(String(b.createdAt ?? "")) -
        Date.parse(String(a.createdAt ?? "")),
    );
  const focus = upcoming[0]?.title || "Intentional progress";
  return (
    <ScreenFrame
      path='wheel.app / chronicles / current'
      title={`Current Chronicle - ${chapter.name}`}
    >
      <div className='current-chapter-content p-4 sm:p-6 md:p-8 space-y-7'>
        <Card className='relative bg-linear-to-br from-[#FFFDF9] to-[#F5EFE4] border border-wheel-sand rounded-2xl p-6 md:p-8 shadow-paper overflow-hidden'>
          <div className='absolute right-8 -top-2 w-36 min-h-8 px-3 py-1 washi-tape rotate-2 rounded-sm flex items-center justify-center'>
            <span className='text-[11px] font-hand text-wheel-navy/70'>
              intentional focus
            </span>
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] items-center gap-8'>
            <div>
              <div className='flex flex-wrap items-center gap-3'>
                <Badge className='text-base font-mono tracking-[.12em] uppercase bg-wheel-navy text-wheel-cream rounded px-3 py-1.5'>
                  Current Chronicle
                </Badge>
                <span className='font-serif text-wheel-slate'>
                  {chapterRange(chapter.start, chapter.end)}
                </span>
              </div>
              <h2 className='font-serif text-4xl md:text-5xl font-bold mt-4 leading-tight'>
                {chapter.name}
              </h2>
              <div className='flex items-start gap-4 mt-5'>
                <span aria-hidden='true' className='text-2xl text-wheel-gold'>
                  ★
                </span>
                <p className='font-serif text-xl md:text-2xl italic text-wheel-slate leading-relaxed'>
                  “{chapter.intention}”
                </p>
              </div>
            </div>
            <Card className='bg-white border border-wheel-border rounded-2xl p-5 md:p-6 shadow-paper'>
              <div className='grid grid-cols-[auto_minmax(0,1fr)] items-start gap-5'>
                <div className='flex items-center gap-3 font-serif text-sm leading-tight text-wheel-slate whitespace-nowrap'>
                  <span className='w-2.5 h-2.5 rounded-full bg-wheel-sage' />
                  <span>
                    Chronicle
                    <br />
                    Journey
                  </span>
                </div>
                <strong className='font-mono text-sm md:text-base leading-snug'>
                  {elapsed} / {duration} Days ({journey}% Waypoints)
                </strong>
              </div>
              <div className='relative mt-8'>
                <div className='h-1 rounded-full bg-wheel-sand' />
                <div
                  className='absolute left-0 top-0 h-1 rounded-full bg-wheel-gold'
                  style={{ width: `${journey}%` }}
                />
                <div className='absolute inset-x-0 -top-2 flex justify-between'>
                  {[0, 25, 50, 75, 100].map((point) => (
                    <span
                      key={point}
                      className={`w-4 h-4 rounded-full border-2 border-white shadow ${point <= journey ? "bg-wheel-gold" : "bg-wheel-parchment"}`}
                    />
                  ))}
                </div>
                <span
                  className='absolute -top-3 w-6 h-6 rounded-full border-4 border-wheel-terracotta bg-white shadow'
                  style={{ left: `calc(${journey}% - 12px)` }}
                />
              </div>
              <div className='flex justify-between gap-4 mt-8 font-hand text-sm text-wheel-slate'>
                <span>Start ({shortDate(chapter.start)})</span>
                <span className='text-wheel-terracotta text-center'>
                  Today: {focus}
                </span>
                <span className='text-right'>
                  Chronicle Climax ({shortDate(chapter.end)})
                </span>
              </div>
            </Card>
          </div>
        </Card>
        <section className='space-y-5'>
          <div className='flex flex-wrap items-end justify-between gap-4'>
            <div>
              <div className='flex flex-wrap items-center gap-3'>
                <h3 className='font-serif text-2xl font-bold'>
                  Selected Quests in this Chronicle
                </h3>
                <Badge className='rounded-full bg-wheel-parchment px-3 py-1 text-sm text-wheel-slate'>
                  {indices.length} active{" "}
                  {indices.length === 1 ? "story" : "stories"}
                </Badge>
              </div>
              <p className='mt-1 text-sm text-wheel-slate'>
                Each quest is a tiny world you’ve chosen to nurture in this
                chronicle.
              </p>
            </div>
            <Button
              onClick={openEditCurrentChapter}
              className='font-serif text-sm text-wheel-navy underline underline-offset-4'
            >
              Revise The Plot
            </Button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            {indices.map((index) => {
              const quest = quests[index];
              if (!quest) return null;
              const progress = questProgress(quest);
              const next = [...(quest.configuration?.subQuests ?? [])]
                .filter((item) => !item.done)
                .sort((a, b) =>
                  (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
                )[0];
              const questId = String(quest.id).split("/").at(-1);
              const emblem = emblems.find(
                (item) =>
                  Array.isArray(item.questIds) &&
                  item.questIds.some(
                    (value) => String(value).split("/").at(-1) === questId,
                  ),
              );
              const active =
                quest.status === "ACTIVE" || quest.status === "ONGOING";
              return (
                <Card
                  key={quest.id || index}
                  className={`relative flex h-full min-w-0 flex-col rounded-2xl border bg-white p-5 pt-7 shadow-paper ${active ? "border-wheel-sage/40" : "border-wheel-gold/60"}`}
                >
                  <Badge
                    className={`absolute right-5 -top-3 rounded-md border px-3 py-1 text-base font-mono tracking-wider ${active ? "bg-wheel-sageLight text-wheel-sage border-wheel-sage/30" : "bg-wheel-parchment text-wheel-terracotta border-wheel-sand"}`}
                  >
                    {quest.status}
                  </Badge>
                  <h4 className='font-serif text-xl font-bold'>
                    {quest.title}
                  </h4>
                  <p className='text-sm text-wheel-slate mt-2 line-clamp-2 whitespace-pre-wrap'>
                    {quest.description || quest.note}
                  </p>
                  <div
                    className={`mt-5 rounded-xl border p-4 ${active ? "bg-wheel-navy text-wheel-cream border-wheel-navy" : "bg-wheel-parchment border-wheel-sand"}`}
                  >
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-center gap-3'>
                        <span className='text-2xl' aria-hidden='true'>
                          {String(emblem?.icon || "✦")}
                        </span>
                        <div>
                          <p
                            className={`font-mono text-sm font-bold ${active ? "text-wheel-gold" : "text-wheel-navy"}`}
                          >
                            {String(emblem?.name || "No emblem assigned")}
                          </p>
                          {emblem?.title && (
                            <p
                              className={`font-serif italic text-sm mt-1 ${active ? "text-wheel-sand" : "text-wheel-slate"}`}
                            >
                              {String(emblem.title)}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className='font-hand text-sm whitespace-nowrap'>
                        {progress}% carved
                      </span>
                    </div>
                  </div>
                  <div className='mt-5 flex items-center justify-between font-mono text-sm'>
                    <span className='text-wheel-slate'>Weighted Progress</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className='h-2 mt-2 rounded-full bg-wheel-parchment overflow-hidden'>
                    <div
                      className={`h-full rounded-full ${active ? "bg-wheel-sage" : "bg-wheel-terracotta"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className='mt-auto flex items-end justify-between gap-4 pt-6'>
                    <p className='font-serif italic text-sm text-wheel-slate'>
                      {next
                        ? `Next: ${next.title}`
                        : progress === 100
                          ? "Quest completed"
                          : "No pending side quests"}
                    </p>
                    <Button
                      onClick={() => openQuest(index, "screen-1")}
                      className='shrink-0 font-serif text-sm text-wheel-terracotta'
                    >
                      Inspect Quest →
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
        {!indices.length && (
          <p className='text-sm text-wheel-slate'>
            No quests assigned to this chronicle yet.
          </p>
        )}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <Card className='flex h-72 flex-col bg-white border border-wheel-border rounded-xl p-5 shadow-paper'>
            <div className='flex flex-wrap justify-between gap-3'>
              <h3 className='font-serif font-bold'>
                Right Now — Important Moments
              </h3>
              {closingSoon > 0 && (
                <Button
                  onClick={() => setView("screen-6")}
                  className='rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 font-mono text-base font-bold text-rose-600'
                >
                  🔥 {closingSoon} Closing Soon →
                </Button>
              )}
            </div>
            <div className='custom-scrollbar mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2'>
              {upcoming.map((item) => {
                const remainingDays = daysUntil(item.dueDate);
                const urgent =
                  millisecondsUntil(item.dueDate) < 72 * 60 * 60 * 1000;
                const questIndex =
                  item.questIndex === undefined
                    ? undefined
                    : indices[item.questIndex];
                return (
                  <Button
                    key={item.id}
                    onClick={() =>
                      questIndex === undefined
                        ? setView("screen-6")
                        : openQuest(questIndex, "screen-1")
                    }
                    className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg border p-3 text-left ${urgent ? "border-rose-300 bg-rose-50/70" : "border-wheel-sand bg-wheel-parchment"}`}
                  >
                    <span
                      className={`font-mono text-base font-bold ${urgent ? "text-rose-600" : "text-wheel-gold"}`}
                    >
                      {shortDate(item.dueDate)}
                    </span>
                    <span className='min-w-0'>
                      <strong className='block text-sm text-wheel-ink'>
                        {item.title}
                      </strong>
                      <span className='mt-0.5 block font-serif text-base italic text-wheel-slate'>
                        {item.quest}
                        {item.points
                          ? ` • ${({ 1: "Easy", 2: "Medium", 3: "Hard", 5: "Critical" } as Record<number, string>)[item.points]} ${item.points}pts`
                          : ""}
                      </span>
                    </span>
                    {urgent && (
                      <Badge className='rounded-md bg-rose-600 px-2 py-1 font-mono text-[10px] text-white'>
                        {remainingDays < 0
                          ? `${Math.abs(remainingDays)}d overdue`
                          : remainingDays === 0
                            ? "Due today"
                            : `Due in ${remainingDays}d`}
                      </Badge>
                    )}
                  </Button>
                );
              })}
              {!upcoming.length && (
                <p className='text-sm text-wheel-slate'>
                  All caught up for now.
                </p>
              )}
            </div>
          </Card>
          <Card className='flex h-72 flex-col bg-white border border-wheel-border rounded-xl p-5 shadow-paper'>
            <h3 className='font-serif font-bold'>📖 Recent Lore</h3>
            <div className='custom-scrollbar mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2'>
              {recentLores.map((lore) => {
                const quest = selectedQuests.find(
                  (item) =>
                    String(item.id).split("/").at(-1) ===
                    String(lore.questId).split("/").at(-1),
                );
                return (
                  <article
                    key={lore.id}
                    className='border-l-2 border-wheel-sage pl-3'
                  >
                    <p className='text-base font-mono text-wheel-slate'>
                      {loreDate(lore.createdAt)}
                      {quest ? ` • ${quest.title}` : ""}
                    </p>
                    <p className='text-sm mt-1 whitespace-pre-wrap'>
                      {String(lore.details ?? lore.description ?? "")}
                    </p>
                  </article>
                );
              })}
              {!recentLores.length && (
                <p className='text-sm text-wheel-slate'>
                  No lore recorded for this chronicle yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </ScreenFrame>
  );
}
