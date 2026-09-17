import { useState } from "react";
import { Badge, Button, Card } from "./ui";
import { Modal } from "./modal";
import { useWheel, type SideQuest } from "./wheel-provider";
const difficulty: Record<number, { label: string; color: string }> = {
  5: { label: "CRITICAL", color: "bg-rose-100 text-rose-800 border-rose-200" },
  3: { label: "HARD", color: "bg-amber-100 text-amber-900 border-amber-200" },
  2: { label: "MEDIUM", color: "bg-blue-100 text-blue-900 border-blue-200" },
  1: {
    label: "EASY",
    color: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
};
function ActionIcon({ deleteIcon = false }: { deleteIcon?: boolean }) {
  return (
    <svg
      aria-hidden='true'
      className='w-3.5 h-3.5'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d={
          deleteIcon
            ? "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        }
      />
    </svg>
  );
}
export function SideQuestList() {
  const {
    sideQuests,
    setSideQuests,
    setEditingSideQuest,
    wholeQuestComplete,
    setWholeQuestComplete,
  } = useWheel();
  const [deleting, setDeleting] = useState<SideQuest | null>(null);
  return (
    <>
      <div className='space-y-2.5'>
        {sideQuests.map((quest) => (
          <Card
            key={quest.id}
            className='group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-wheel-border shadow-sm hover:border-wheel-sand'
          >
            <label className='flex flex-1 min-w-0 items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={quest.done}
                onChange={() =>
                  setSideQuests((items) =>
                    items.map((item) =>
                      item.id === quest.id
                        ? { ...item, done: !item.done }
                        : item,
                    ),
                  )
                }
                className='w-4 h-4 shrink-0 accent-wheel-terracotta'
              />
              <span className='min-w-0'>
                <span
                  title={quest.title}
                  className={`block truncate text-base font-medium ${quest.done ? "line-through opacity-70" : ""}`}
                >
                  {quest.title}
                </span>
                <span
                  title={quest.note}
                  className='block truncate text-[10px] text-wheel-slate font-serif italic'
                >
                  {quest.note}
                </span>
                {quest.dueDate && (
                  <time
                    dateTime={quest.dueDate}
                    className='text-[10px] text-wheel-terracotta'
                  >
                    ⏳ {quest.dueDate}
                  </time>
                )}
              </span>
            </label>
            <div className='flex shrink-0 items-center gap-2'>
              <Badge
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${difficulty[quest.points].color}`}
              >
                {difficulty[quest.points].label} ({quest.points}{" "}
                {quest.points === 1 ? "PT" : "PTS"})
              </Badge>
              <div className='flex gap-1 pl-1 border-l border-wheel-sand/60'>
                <Button
                  aria-label={`Edit ${quest.title}`}
                  onClick={() => setEditingSideQuest(quest)}
                  className='p-2 text-wheel-slate hover:bg-wheel-sand/30 rounded'
                >
                  <ActionIcon />
                </Button>
                <Button
                  aria-label={`Delete ${quest.title}`}
                  onClick={() => setDeleting(quest)}
                  className='p-2 text-wheel-slate hover:text-wheel-stampRed hover:bg-rose-50 rounded'
                >
                  <ActionIcon deleteIcon />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {!sideQuests.length && (
        <Card className='p-6 text-center bg-white/80 border border-dashed border-wheel-sand rounded-xl'>
          <span aria-hidden='true' className='text-2xl block mb-1'>
            🕊️
          </span>
          <h4 className='font-serif font-bold text-sm text-wheel-navy'>
            No Side Quests Attached
          </h4>
          <p className='text-base text-wheel-slate mt-1 max-w-sm mx-auto'>
            Without sub-challenges, this Quest stands whole. You can complete
            the entire quest at once or sketch a new side quest anytime.
          </p>
          <Button
            disabled={wholeQuestComplete}
            onClick={() => setWholeQuestComplete(true)}
            className='mt-3 px-3.5 py-1.5 bg-wheel-sage text-white font-serif text-base rounded-lg'
          >
            {wholeQuestComplete
              ? "Quest Complete ✓"
              : "Mark Whole Quest Complete"}
          </Button>
        </Card>
      )}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title='Delete side quest'
      >
        <div className='bg-wheel-cream p-6 rounded-2xl space-y-4'>
          <h2 className='font-serif text-xl'>Let this side quest go?</h2>
          <p className='text-sm text-wheel-slate'>
            Delete “{deleting?.title}”? Its difficulty points will be removed
            from the quest progress.
          </p>
          <div className='flex justify-end gap-3'>
            <Button autoFocus onClick={() => setDeleting(null)}>
              Keep Side Quest
            </Button>
            <Button
              className='px-4 py-2 rounded-lg bg-wheel-stampRed text-white'
              onClick={() => {
                setSideQuests((items) =>
                  items.filter((item) => item.id !== deleting?.id),
                );
                setWholeQuestComplete(false);
                setDeleting(null);
              }}
            >
              Delete Side Quest
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
export function QuestPicker() {
  const { quests, selected, setSelected } = useWheel();
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
      {quests.map((quest, index) => {
        const questId =
          String(quest.id ?? index)
            .split("/")
            .at(-1) || String(index);
        return (
          <Button
            key={questId}
            aria-pressed={selected.includes(questId)}
            onClick={() =>
              setSelected((items) =>
                items.includes(questId)
                  ? items.filter((item) => item !== questId)
                  : [...items, questId],
              )
            }
            className={`border-2 p-3 rounded-xl flex items-start gap-3 text-left ${selected.includes(questId) ? "border-wheel-gold bg-white" : "border-wheel-sand bg-wheel-cream"}`}
          >
            <span
              aria-hidden='true'
              className='w-5 h-5 border border-wheel-gold rounded-full shrink-0 text-center text-wheel-gold'
            >
              {selected.includes(questId) ? "✓" : ""}
            </span>
            <span>
              <span className='text-base font-serif font-bold'>
                {quest.title}
              </span>
              <span className='block text-[10px] text-wheel-sage'>
                {quest.status}
              </span>
              <span className='block text-[11px] text-wheel-slate'>
                {quest.note}
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
export function QuestEditor() {
  const {
    addingSideQuest,
    setAddingSideQuest,
    addingQuest,
    setAddingQuest,
    editingSideQuest,
    setEditingSideQuest,
  } = useWheel();
  const open = addingSideQuest || addingQuest || editingSideQuest !== null;
  const close = () => {
    setAddingSideQuest(false);
    setAddingQuest(false);
    setEditingSideQuest(null);
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title={
        editingSideQuest
          ? "Edit Side Quest"
          : addingSideQuest
            ? "Add Side Quest"
            : "Create Quest"
      }
    >
      {open && (
        <QuestEditorForm
          key={editingSideQuest?.id ?? (addingSideQuest ? "side" : "quest")}
          existing={editingSideQuest}
          isSideQuest={addingSideQuest || editingSideQuest !== null}
          close={close}
        />
      )}
    </Modal>
  );
}
function QuestEditorForm({
  existing,
  isSideQuest,
  close,
}: {
  existing: SideQuest | null;
  isSideQuest: boolean;
  close: () => void;
}) {
  const { setSideQuests, createQuest, setWholeQuestComplete } = useWheel();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");
  const [points, setPoints] = useState(existing?.points ?? 2);
  const fieldClass =
    "block w-full mt-1 border border-wheel-sand rounded-lg bg-wheel-parchment/60 px-3 py-2 focus:bg-white";
  return (
    <form
      className='bg-wheel-cream p-6 space-y-4 rounded-2xl text-base'
      onSubmit={async (event) => {
        event.preventDefault();
        if (!title.trim()) return;
        if (isSideQuest) {
          const next = {
            id: existing?.id ?? Date.now(),
            title: title.trim(),
            note: note.trim(),
            points,
            dueDate,
            done: existing?.done ?? false,
          };
          setSideQuests((items) =>
            existing
              ? items.map((item) => (item.id === existing.id ? next : item))
              : [...items, next],
          );
          setWholeQuestComplete(false);
        } else {
          const saved = await createQuest({
            title: title.trim(),
            note: note.trim() || "A new possibility",
            description: note.trim(),
            status: "PLANNING",
          });
          if (!saved) return;
        }
        close();
      }}
    >
      <div className='flex justify-between gap-3'>
        <div>
          <h2 className='font-serif text-lg font-bold'>
            {existing
              ? "Edit Side Quest"
              : isSideQuest
                ? "Add Side Quest"
                : "Sketch a New Quest"}
          </h2>
          <p className='text-wheel-slate mt-1'>
            Tune the title, notes, and next steps.
          </p>
        </div>
        <Button
          aria-label='Close editor'
          onClick={close}
          className='text-lg px-2'
        >
          ×
        </Button>
      </div>
      <label className='block font-mono'>
        {isSideQuest ? "Side Quest Title" : "Quest Title"}
        <input
          autoFocus
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className='block font-mono'>
        Notes / Details (Optional)
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={fieldClass}
        />
      </label>
      {isSideQuest && (
        <>
          <label className='block font-mono'>
            Target Due Date (Optional)
            <input
              type='date'
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={fieldClass}
            />
          </label>
          <fieldset>
            <legend className='font-mono mb-2'>
              Difficulty & Impact Weight
            </legend>
            <div className='grid grid-cols-2 gap-2'>
              {Object.entries(difficulty).map(([value, item]) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${points === Number(value) ? item.color : "bg-white border-wheel-sand"}`}
                >
                  <input
                    type='radio'
                    name='side-quest-difficulty'
                    checked={points === Number(value)}
                    onChange={() => setPoints(Number(value))}
                  />
                  {item.label} ({value} {value === "1" ? "pt" : "pts"})
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}
      <div className='flex justify-end gap-3'>
        <Button onClick={close}>Cancel</Button>
        <Button
          type='submit'
          disabled={!title.trim()}
          className='bg-wheel-navy text-wheel-cream px-4 py-2 rounded-lg'
        >
          {existing
            ? "Save Changes"
            : isSideQuest
              ? "Add Side Quest"
              : "Add Quest"}
        </Button>
      </div>
    </form>
  );
}
