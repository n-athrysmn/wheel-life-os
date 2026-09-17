import { Button, Card } from "./ui";
import type { QuestSubQuest } from "../helpers/quest-definition";
export function SubQuestFields({
  items,
  onChange,
}: {
  items: QuestSubQuest[];
  onChange: (items: QuestSubQuest[]) => void;
}) {
  const field =
    "block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2 text-sm text-wheel-ink";
  function update(id: string, patch: Partial<QuestSubQuest>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }
  return (
    <section aria-label='Side quests' className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='font-serif text-lg font-bold'>Side quests</h3>
        <span className='text-base text-wheel-slate'>{items.length} added</span>
      </div>
      {items.map((item, index) => (
        <Card
          key={item.id}
          className='rounded-xl border border-wheel-sand bg-wheel-parchment/40 p-4 space-y-4'
        >
          <div className='flex items-center justify-between'>
            <h4 className='text-sm font-semibold'>Side quest {index + 1}</h4>
            <Button
              aria-label={`Remove side quest ${index + 1}`}
              onClick={() =>
                onChange(items.filter((entry) => entry.id !== item.id))
              }
              className='text-base text-wheel-terracotta px-2 py-1'
            >
              Remove
            </Button>
          </div>
          <label className='block text-sm font-mono'>
            Side Quest Title
            <input
              required
              maxLength={160}
              value={item.title}
              onChange={(event) =>
                update(item.id, { title: event.target.value })
              }
              placeholder='What is the next step?'
              className={field}
            />
          </label>
          <label className='block text-sm font-mono'>
            Notes / Details (Optional)
            <input
              value={item.note}
              onChange={(event) =>
                update(item.id, { note: event.target.value })
              }
              className={field}
            />
          </label>
          <label className='block text-sm font-mono'>
            Mode (Optional)
            <input
              value={item.mode ?? ""}
              onChange={(event) =>
                update(item.id, { mode: event.target.value })
              }
              placeholder='e.g. Online'
              className={field}
            />
          </label>
          <label className='block text-sm font-mono'>
            Target Due Date (Optional)
            <input
              type='date'
              value={item.dueDate}
              onChange={(event) =>
                update(item.id, { dueDate: event.target.value })
              }
              className={field}
            />
          </label>
          <fieldset>
            <legend className='text-sm font-mono mb-2'>
              Difficulty &amp; Impact Weight
            </legend>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
              {[
                { points: 1, priority: "low", label: "EASY" },
                { points: 2, priority: "medium", label: "MEDIUM" },
                { points: 3, priority: "high", label: "HARD" },
                { points: 5, priority: "critical", label: "CRITICAL" },
              ].map((option) => (
                <label
                  key={option.points}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm cursor-pointer ${item.points === option.points ? "border-wheel-gold bg-wheel-goldLight/30" : "border-wheel-sand bg-white"}`}
                >
                  <input
                    type='radio'
                    name={`sidequest-difficulty-${item.id}`}
                    checked={item.points === option.points}
                    onChange={() =>
                      update(item.id, {
                        points: option.points,
                        priority: option.priority,
                      })
                    }
                    className='accent-wheel-sage'
                  />
                  {option.label} ({option.points}{" "}
                  {option.points === 1 ? "pt" : "pts"})
                </label>
              ))}
            </div>
          </fieldset>
        </Card>
      ))}
      <Button
        onClick={() =>
          onChange([
            ...items,
            {
              id: crypto.randomUUID(),
              title: "",
              note: "",
              mode: "",
              dueDate: "",
              points: 1,
              priority: "low",
              done: false,
            },
          ])
        }
        className='w-full px-4 py-3 rounded-xl border border-dashed border-wheel-sand text-wheel-navy bg-wheel-parchment/40 text-sm font-semibold'
      >
        + Side Quest
      </Button>
    </section>
  );
}
