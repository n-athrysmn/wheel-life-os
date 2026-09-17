import { Badge, Button, Card } from "./ui";
import { daysUntil, horizonFor, type Deadline } from "../helpers/deadlines";
import { useWheel } from "./wheel-provider";
function displayDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    date,
  );
  return `${month} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
}
export function DeadlineCard({ deadline }: { deadline: Deadline }) {
  const { setView, openQuest, resolveDeadline } = useWheel();
  const days = daysUntil(deadline.dueDate);
  const urgent = horizonFor(deadline.dueDate) === "urgent";
  const timing =
    days < 0
      ? `${Math.abs(days)} days overdue`
      : days === 0
        ? "Due today"
        : `Due in ${days} ${days === 1 ? "day" : "days"}`;
  return (
    <Card
      className={`relative rounded-xl p-4 shadow-sm border ${deadline.done ? "bg-wheel-sageLight border-wheel-sage/30" : urgent ? "bg-linear-to-br from-white to-rose-50/50 border-rose-300 border-2" : deadline.type === "quest" ? "bg-wheel-goldLight/30 border-wheel-gold/40 ticket-edge" : "bg-white border-wheel-border"}`}
    >
      <div className='flex flex-wrap justify-between items-center gap-2 text-[10px] font-mono mb-3'>
        <Badge
          className={`px-2 py-0.5 rounded border ${urgent && !deadline.done ? "bg-rose-100 border-rose-200 text-rose-900" : "bg-wheel-parchment border-wheel-sand text-wheel-slate"}`}
        >
          {deadline.done ? "Completed" : `⏳ ${timing}`} •{" "}
          <time dateTime={deadline.dueDate}>
            {displayDate(deadline.dueDate)}
          </time>
        </Badge>
        {deadline.points && (
          <Badge className='font-bold text-wheel-terracotta'>
            {
              (
                { 1: "EASY", 2: "MEDIUM", 3: "HARD", 5: "CRITICAL" } as Record<
                  number,
                  string
                >
              )[deadline.points]
            }{" "}
            ({deadline.points} {deadline.points === 1 ? "PT" : "PTS"})
          </Badge>
        )}
      </div>
      <p className='text-base font-mono text-wheel-terracotta'>
        {deadline.quest} •{" "}
        {deadline.type === "quest" ? "Milestone" : "Sub-Challenge"}
      </p>
      <h4
        className={`font-serif text-base font-bold mt-1 ${deadline.done ? "line-through text-wheel-slate" : "text-wheel-ink"}`}
      >
        {deadline.title}
      </h4>
      <p className='text-base text-wheel-slate font-serif italic mt-1'>
        {deadline.note}
      </p>
      <div className='mt-4 pt-3 border-t border-wheel-sand/50 flex flex-wrap justify-between gap-3'>
        <Button
          className='text-base font-serif text-wheel-navy underline underline-offset-4'
          onClick={() => {
            if (deadline.questIndex !== undefined)
              openQuest(deadline.questIndex);
            else if (
              deadline.sideQuestId !== undefined ||
              deadline.id === "ceremony"
            )
              openQuest(0);
            else setView("screen-1");
          }}
        >
          Inspect in{" "}
          {deadline.quest.startsWith("STI") || deadline.id === "ceremony"
            ? "Quest"
            : "Chronicle"}{" "}
          →
        </Button>
        <Button
          disabled={deadline.done}
          onClick={() => resolveDeadline(deadline.id)}
          className={`px-3 py-1.5 text-base font-serif font-bold rounded-lg ${deadline.done ? "bg-wheel-sageLight text-wheel-sage" : "bg-wheel-navy text-white"}`}
        >
          {deadline.done ? "Completed ✓" : "Mark Complete ✓"}
        </Button>
      </div>
    </Card>
  );
}
