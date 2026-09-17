import { useState } from "react";
import { Badge, Button, Card, ScreenFrame } from "../ui";
import { horizonFor, radarDate, type Horizon } from "../../helpers/deadlines";
import { DeadlineCard } from "../deadline-card";
import { useWheel } from "../wheel-provider";
const horizons: { id: Horizon; title: string; color: string }[] = [
  {
    id: "urgent",
    title: "Closing Soon — Under 72 Hours",
    color: "radar-urgent-text border-red-500/50",
  },
  {
    id: "week",
    title: "On the Horizon — Next 7 Days",
    color: "text-amber-900 border-wheel-sand",
  },
  {
    id: "later",
    title: "Later on the Horizon",
    color: "text-wheel-sage border-wheel-sand",
  },
];
export function DueDatesRadar() {
  const { deadlines, setView } = useWheel();
  const [filter, setFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const visible = deadlines.filter(
    (item) =>
      (showCompleted || !item.done) &&
      (filter === "all" ||
        (filter === "urgent"
          ? horizonFor(item.dueDate) === "urgent"
          : item.type === filter)),
  );
  return (
    <ScreenFrame
      path='wheel.app / due-dates-radar'
      title='Due Dates Radar — The Life Chronometer'
    >
      <div className='p-6 md:p-8 space-y-6 bg-[#FCFAF7]'>
        <Card className='relative bg-gradient-to-r from-wheel-navy via-[#1F2E3E] to-[#121B27] text-wheel-cream rounded-2xl p-6 border border-rose-400/40 shadow-card-lift overflow-hidden'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div>
              <Badge className='inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-400/20 text-rose-300 text-base font-mono tracking-wider mb-2 border border-rose-400/30'>
                ⏰ TEMPORAL HORIZON RADAR
              </Badge>
              <h2 className='font-serif text-2xl md:text-3xl font-bold text-white tracking-tight'>
                Closing Side Quests & Milestones
              </h2>
              <p className='text-base md:text-sm text-wheel-sand/85 mt-1 max-w-xl font-serif italic'>
                “Gently tracking moments that ask for your arrival. Not a
                frantic sprint backlog, but waypoints on a map.”
              </p>
              <p className='text-[10px] font-mono text-wheel-sand/70 mt-3'>
                Chronicle snapshot • {radarDate}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-3 bg-black/40 border border-white/10 p-3 rounded-xl'>
              {horizons.map((horizon, index) => (
                <div key={horizon.id} className='text-center px-2'>
                  <span className='block font-mono text-xl font-bold text-wheel-gold'>
                    {
                      deadlines.filter(
                        (item) =>
                          !item.done && horizonFor(item.dueDate) === horizon.id,
                      ).length
                    }
                  </span>
                  <span className='text-[9px] uppercase font-mono text-wheel-sand/80'>
                    {["Under 72h", "Next 7 days", "Later"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <div className='flex flex-wrap justify-between gap-3'>
          <div aria-label='Deadline filters' className='flex flex-wrap gap-2'>
            {[
              ["all", "All Waypoints"],
              ["urgent", "Imminent (< 72h)"],
              ["sidequest", "Side Quests"],
              ["quest", "Quest Milestones"],
            ].map(([id, label]) => (
              <Button
                key={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={`text-base px-3 py-1.5 rounded-lg border ${filter === id ? "bg-wheel-navy text-white border-wheel-navy" : "bg-white border-wheel-sand text-wheel-slate"}`}
              >
                {id === "urgent" && (
                  <span className='urgency-beacon mr-2' aria-hidden='true'>
                    <i />
                    <i />
                  </span>
                )}
                {label}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => setView("screen-7")}
            className='text-base font-serif bg-wheel-parchment border border-wheel-sand px-3 py-1.5 rounded-lg'
          >
            + Add Quest
          </Button>
        </div>
        <div className='flex justify-between gap-3 text-base text-wheel-slate'>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={showCompleted}
              onChange={(event) => setShowCompleted(event.target.checked)}
              className='accent-wheel-sage'
            />
            Show completed
          </label>
          <span role='status'>{visible.length} waypoints</span>
        </div>
        {horizons.map((horizon) => {
          const items = visible.filter(
            (item) => horizonFor(item.dueDate) === horizon.id,
          );
          return (
            items.length > 0 && (
              <section
                key={horizon.id}
                aria-label={horizon.title}
                className='space-y-3'
              >
                <div
                  className={`flex flex-wrap justify-between gap-2 border-b pb-2 ${horizon.color}`}
                >
                  <h3 className='flex items-center gap-2 font-serif text-sm font-bold uppercase tracking-wide'>
                    {horizon.id === "urgent" ? (
                      <span className='urgency-beacon' aria-hidden='true'>
                        <i />
                        <i />
                      </span>
                    ) : (
                      <span
                        aria-hidden='true'
                        className='inline-block h-2.5 w-2.5 rounded-full bg-current'
                      />
                    )}
                    {horizon.title}
                  </h3>
                  <span className='text-[11px] font-mono'>
                    {items.length}{" "}
                    {items.length === 1 ? "Waypoint" : "Waypoints"}
                  </span>
                </div>
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 ${horizon.id === "week" ? "xl:grid-cols-3" : ""}`}
                >
                  {items.map((item) => (
                    <DeadlineCard key={item.id} deadline={item} />
                  ))}
                </div>
              </section>
            )
          );
        })}
        {!visible.length && (
          <Card className='p-8 text-center bg-white border border-dashed border-wheel-sand rounded-xl'>
            <h3 className='font-serif text-lg'>A little room to breathe</h3>
            <p className='text-sm text-wheel-slate mt-2'>
              No waypoints match this view. Try another filter or add a dated
              side quest.
            </p>
          </Card>
        )}
        <div className='p-4 rounded-xl bg-wheel-parchment border border-wheel-sand flex flex-wrap justify-between items-center gap-4'>
          <p className='text-base font-serif italic text-wheel-slate max-w-xl'>
            “Dates in Wheel are not commitments made to an employer; they are
            promises made to what you wish to see born into the world.”
          </p>
          <Button
            onClick={() => setView("screen-1")}
            className='text-base text-wheel-navy font-semibold font-serif'
          >
            Back to Current Chronicle →
          </Button>
        </div>
      </div>
    </ScreenFrame>
  );
}
