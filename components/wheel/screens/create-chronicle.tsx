import { useState } from "react";
import {
  createChronicle,
  updateChronicle,
} from "@/components/helpers/endpoints";
import type { ChronicleRecord } from "../../helpers/workspace-data";
import { Button, Card, ScreenFrame } from "../ui";
import { useWheel } from "../wheel-provider";
import {
  endOfKualaLumpurDay,
  kualaLumpurDate,
  startOfKualaLumpurDay,
} from "../../helpers/date-time";

type Props = {
  chronicle?: ChronicleRecord;
  onClose: () => void;
  onSaved?: () => void;
};

function day(value: string) {
  return kualaLumpurDate(value);
}

export function CreateChronicle({ chronicle, onClose, onSaved }: Props) {
  const { chapters, chronicles, refreshData, setActionLoading } = useWheel();
  const editing = Boolean(chronicle);
  const [draft, setDraft] = useState({
    title: chronicle?.title ?? "",
    subtitle: chronicle?.subtitle ?? "",
    description: chronicle?.description ?? "",
    start: day(chronicle?.start ?? ""),
    end: day(chronicle?.end ?? ""),
  });
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setNotice("");
    if (
      !draft.title.trim() ||
      !draft.start ||
      !draft.end ||
      draft.end < draft.start
    ) {
      setNotice("Add a title and choose a valid date range.");
      return;
    }
    const overlap = chronicles.some(
      (item) =>
        item.id !== chronicle?.id &&
        day(item.start) <= draft.end &&
        day(item.end) >= draft.start,
    );
    if (overlap) {
      setNotice(
        "Chronicle dates cannot overlap. Place this chronicle before or after the existing ones.",
      );
      return;
    }
    const chapterIds = chapters
      .filter(
        (item) => day(item.start) <= draft.end && day(item.end) >= draft.start,
      )
      .map((item) => item.id);
    const today = new Date().toISOString().slice(0, 10);
    const status =
      draft.end < today
        ? "completed"
        : draft.start > today
          ? "upcoming"
          : "ongoing";
    const payload = {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      description: draft.description.trim(),
      startsAt: startOfKualaLumpurDay(draft.start),
      endsAt: endOfKualaLumpurDay(draft.end),
      status,
      chaptersId: chapterIds,
      updatedAt: new Date().toISOString(),
      ...(editing ? {} : { createdAt: new Date().toISOString() }),
    };
    setSaving(true);
    setActionLoading(
      editing ? "Amending the Chronicle…" : "Beginning the Chronicle…",
    );
    const response = chronicle
      ? await updateChronicle(chronicle.id, payload)
      : await createChronicle(payload);
    setSaving(false);
    setActionLoading(null);
    if (response.status >= 400) {
      setNotice(
        response.data instanceof Error
          ? response.data.message
          : "Could not save chronicle.",
      );
      return;
    }
    await refreshData();
    (onSaved ?? onClose)();
  }

  return (
    <ScreenFrame
      path={`wheel.app / chronicles / ${editing ? "amend" : "new"}`}
      title={editing ? `Amend ${chronicle?.title}` : "Create New Chronicle"}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className='flex max-h-230 flex-1 flex-col space-y-6 overflow-y-auto bg-[#FCFAF7] p-6 custom-scrollbar md:p-8'>
          <div>
            <div className='mb-1 inline-flex items-center gap-1.5 rounded-full bg-wheel-gold/15 px-2.5 py-0.5 font-mono text-base text-wheel-ink'>
              ✦ Intentional Chronicle Crafting
            </div>
            <h2 className='font-serif text-2xl font-bold text-wheel-ink'>
              {editing ? "Amend the Chronicle" : "Begin a New Chronicle"}
            </h2>
            <p className='mt-1 max-w-xl text-base text-wheel-slate'>
              Define the season. Chapters whose full date range falls inside it
              will be mapped automatically.
            </p>
          </div>
          <Card className='space-y-4 rounded-xl border border-wheel-border bg-white p-5 shadow-sm'>
            <label className='block'>
              <span className='mb-1 block font-mono text-base font-bold uppercase tracking-wider text-wheel-slate'>
                Chronicle title
              </span>
              <input
                required
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                className='w-full rounded-lg border border-wheel-sand bg-wheel-parchment/40 px-3.5 py-2 font-serif text-sm font-bold text-wheel-ink focus:border-wheel-gold focus:bg-white focus:outline-none'
              />
            </label>
            <label className='block'>
              <span className='mb-1 block font-mono text-base font-bold uppercase tracking-wider text-wheel-slate'>
                Subtitle
              </span>
              <input
                value={draft.subtitle}
                onChange={(event) =>
                  setDraft({ ...draft, subtitle: event.target.value })
                }
                className='w-full rounded-lg border border-wheel-sand bg-wheel-parchment/40 px-3.5 py-2 text-sm text-wheel-ink'
              />
            </label>
            <label className='block'>
              <span className='mb-1 block font-mono text-base font-bold uppercase tracking-wider text-wheel-slate'>
                Description
              </span>
              <textarea
                required
                rows={4}
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                className='w-full rounded-lg border border-wheel-sand bg-wheel-parchment/40 px-3.5 py-2 text-sm text-wheel-ink'
              />
            </label>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <label>
                <span className='mb-1 block font-mono text-base font-bold uppercase tracking-wider text-wheel-slate'>
                  Start date
                </span>
                <input
                  type='date'
                  required
                  value={draft.start}
                  onChange={(event) =>
                    setDraft({ ...draft, start: event.target.value })
                  }
                  className='w-full rounded-lg border border-wheel-sand bg-wheel-parchment/40 px-3 py-2 font-mono text-base text-wheel-ink'
                />
              </label>
              <label>
                <span className='mb-1 block font-mono text-base font-bold uppercase tracking-wider text-wheel-slate'>
                  End date
                </span>
                <input
                  type='date'
                  required
                  min={draft.start}
                  value={draft.end}
                  onChange={(event) =>
                    setDraft({ ...draft, end: event.target.value })
                  }
                  className='w-full rounded-lg border border-wheel-sand bg-wheel-parchment/40 px-3 py-2 font-mono text-base text-wheel-ink'
                />
              </label>
            </div>
          </Card>
          {notice && (
            <p role='alert' className='text-sm text-wheel-terracotta'>
              {notice}
            </p>
          )}
          <div className='flex items-center justify-between border-t border-wheel-sand pt-4'>
            <Button
              type='button'
              onClick={onClose}
              className='font-serif text-sm text-wheel-slate'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={saving}
              className='rounded-xl bg-wheel-navy px-4 py-2 font-serif text-base text-wheel-cream disabled:opacity-60'
            >
              {saving
                ? "Saving…"
                : editing
                  ? "Seal the Amendment →"
                  : "Seal the Chronicle →"}
            </Button>
          </div>
        </div>
      </form>
    </ScreenFrame>
  );
}
