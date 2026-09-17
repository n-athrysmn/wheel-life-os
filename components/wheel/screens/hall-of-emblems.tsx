import { useState } from "react";
import { createEmblem, updateEmblem } from "@/components/helpers/endpoints";
import type { FirebaseRecord } from "@/components/helpers/interface";
import { EmblemCard } from "../emblem-card";
import { resolveEmblemStatus } from "../../helpers/emblem-state";
import { Modal } from "../modal";
import { Badge, Button, Card, ScreenFrame } from "../ui";
import { useWheel } from "../wheel-provider";

type EmblemDraft = {
  id?: string;
  name: string;
  title: string;
  icon: string;
  category: string;
  tagline: string;
  description: string;
  theme: string;
  tags: string;
  questIds: string;
  chapterIds: string;
  chronicleIds: string;
};

const blankDraft: EmblemDraft = {
  name: "",
  title: "",
  icon: "✦",
  category: "STEM & Craft",
  tagline: "",
  description: "",
  theme: "#c59a45",
  tags: "",
  questIds: "",
  chapterIds: "",
  chronicleIds: "",
};

const emojiChoices = [
  ["✦", "star sparkle"],
  ["🏆", "trophy award"],
  ["🎖️", "medal award"],
  ["🏛️", "hall monument"],
  ["🔬", "science microscope"],
  ["⚛️", "atom science"],
  ["⚙️", "gear engineering"],
  ["💡", "idea light"],
  ["🎨", "art palette"],
  ["🎵", "music note"],
  ["🎻", "violin music"],
  ["📚", "books learning"],
  ["🧭", "compass voyage"],
  ["🗺️", "map voyage"],
  ["✈️", "plane travel"],
  ["🏔️", "mountain travel"],
  ["🌊", "ocean"],
  ["🌱", "growth leaf"],
  ["🌿", "nature leaf"],
  ["🔥", "flame courage"],
  ["💎", "gem keepsake"],
  ["🛡️", "shield courage"],
  ["🔑", "key unlock"],
  ["🧵", "thread craft"],
] as const;
const themeChoices = [
  ["#c59a45", "Gold"],
  ["#79a58b", "Sage"],
  ["#80adcf", "Blue"],
  ["#d27764", "Terracotta"],
  ["#d88a9a", "Rose"],
  ["#9c90ba", "Purple"],
  ["#aeb8c5", "Silver"],
  ["#b48740", "Bronze"],
] as const;

function MultiLinkSelector({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
}) {
  const selected = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const selectedNames = options
    .filter((option) => selected.includes(option.id))
    .map((option) => option.name);
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((item) => item !== id).join(", ")
        : [...selected, id].join(", "),
    );
  }
  return (
    <details className='relative'>
      <summary className='cursor-pointer list-none rounded-lg border border-wheel-sand bg-white px-3 py-2 font-mono text-sm'>
        <span className='block text-base text-wheel-slate'>{label}</span>
        <span className='mt-1 block truncate'>
          {selectedNames.length
            ? selectedNames.join(", ")
            : `Select ${label.toLowerCase()}`}
        </span>
      </summary>
      <div className='absolute inset-x-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-wheel-border bg-wheel-card p-2 shadow-card-lift'>
        {options.map((option) => (
          <label
            key={option.id}
            className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-wheel-parchment'
          >
            <input
              type='checkbox'
              checked={selected.includes(option.id)}
              onChange={() => toggle(option.id)}
            />
            <span className='min-w-0 truncate'>{option.name}</span>
          </label>
        ))}
        {!options.length && (
          <p className='p-2 text-base text-wheel-slate'>
            No records available.
          </p>
        )}
      </div>
    </details>
  );
}

function draftFor(record: FirebaseRecord): EmblemDraft {
  return {
    id: record.id,
    name: String(record.name ?? ""),
    title: String(record.title ?? ""),
    icon: String(record.icon ?? "✦"),
    category: String(record.category ?? "STEM & Craft"),
    tagline: String(record.tagline ?? ""),
    description: String(record.description ?? ""),
    theme: String(record.theme ?? "#c59a45"),
    tags: Array.isArray(record.tags) ? record.tags.join(", ") : "",
    questIds: Array.isArray(record.questIds) ? record.questIds.join(", ") : "",
    chapterIds: Array.isArray(record.chapterIds)
      ? record.chapterIds.join(", ")
      : "",
    chronicleIds: Array.isArray(record.chronicleIds)
      ? record.chronicleIds.join(", ")
      : "",
  };
}

export function HallOfEmblems() {
  const {
    emblems,
    quests,
    chapters,
    chronicles,
    profile,
    dataError,
    refreshData,
    setActionLoading,
  } = useWheel();
  const [filter, setFilter] = useState("All Emblems");
  const [draft, setDraft] = useState<EmblemDraft | null>(null);
  const [saveError, setSaveError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");
  const canEdit =
    String(profile?.email ?? "")
      .trim()
      .toLowerCase() === "yui.jayn@gmail.com";
  const resolved = emblems.map((emblem) => ({
    emblem,
    ...resolveEmblemStatus(emblem, quests, chapters, chronicles),
  }));
  const visible = resolved.filter(
    ({ emblem }) => filter === "All Emblems" || emblem.category === filter,
  );
  const unlocked = resolved.filter((item) => item.status === "unlocked").length;
  const forging = resolved.filter((item) => item.status === "forging").length;

  function closeEditor() {
    setDraft(null);
    setEmojiOpen(false);
    setEmojiSearch("");
    setSaveError("");
    setActionLoading(null);
  }

  function openEditor(nextDraft: EmblemDraft) {
    setEmojiOpen(false);
    setEmojiSearch("");
    setSaveError("");
    setDraft(nextDraft);
  }

  async function saveEmblem() {
    if (!draft?.title.trim()) return;
    setSaveError("");
    setActionLoading("Writing it into the Wheel…");
    const linkedIds = (value: string) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const relationships = {
      questIds: linkedIds(draft.questIds),
      chapterIds: linkedIds(draft.chapterIds),
      chronicleIds: linkedIds(draft.chronicleIds),
    };
    const derived = resolveEmblemStatus(
      { id: draft.id ?? "new", ...relationships },
      quests,
      chapters,
      chronicles,
    );
    const payload = {
      name: draft.name.trim(),
      title: draft.title.trim(),
      icon: draft.icon.trim() || "✦",
      category: draft.category.trim(),
      tagline: draft.tagline.trim(),
      description: draft.description.trim(),
      theme: draft.theme.trim(),
      tags: linkedIds(draft.tags),
      ...relationships,
      status: derived.status,
      acquiredStatus: derived.acquiredStatus,
      ...(derived.acquiredStatus
        ? { acquiredAt: new Date().toISOString() }
        : {}),
      updatedAt: new Date().toISOString(),
      ...(!draft.id ? { createdAt: new Date().toISOString() } : {}),
    };
    const response = draft.id
      ? await updateEmblem(draft.id, payload)
      : await createEmblem(payload);
    setActionLoading(null);
    if (response.status >= 400 || response.data instanceof Error) {
      setSaveError(
        response.data instanceof Error
          ? response.data.message
          : "Could not save emblem.",
      );
      return;
    }
    closeEditor();
    await refreshData();
  }

  return (
    <ScreenFrame
      path='wheel.app / hall-of-emblems'
      title='5. Hall of Emblems — Keepsake Sanctuary'
    >
      <div className='p-6 md:p-8 space-y-6 bg-[#FCFAF7]'>
        <Card className='relative overflow-hidden rounded-2xl border border-wheel-gold/50 bg-gradient-to-r from-wheel-navy via-[#172433] to-wheel-midnight p-6 text-wheel-cream shadow-card-lift'>
          <div
            aria-hidden='true'
            className='absolute -right-8 -top-8 h-40 w-40 rounded-full bg-wheel-gold/10 blur-2xl'
          />
          <div className='relative flex flex-col justify-between gap-4 md:flex-row md:items-center'>
            <div>
              <Badge className='mb-2 inline-flex items-center gap-2 rounded-full border border-wheel-gold/30 bg-wheel-gold/20 px-2.5 py-0.5 font-mono text-base tracking-wider text-wheel-gold'>
                🏛️ COLLECTIBLE LIFE SOUVENIRS
              </Badge>
              <h2 className='font-serif text-2xl font-bold text-white md:text-3xl'>
                Hall of Emblems
              </h2>
              <p className='mt-1 max-w-xl font-serif text-base italic text-wheel-sand/80 md:text-sm'>
                “Not gaming trophies, but tangible fragments of personhood
                earned through quiet persistence, courage, and curiosity.”
              </p>
            </div>
            <div className='flex items-center gap-3'>
              {canEdit && (
                <Button
                  onClick={() => openEditor({ ...blankDraft })}
                  className='rounded-lg border border-wheel-gold bg-wheel-gold px-4 py-2 font-mono text-base font-bold text-wheel-navy'
                >
                  + Add Emblem
                </Button>
              )}
              <div className='flex shrink-0 items-center gap-3 rounded-xl border border-wheel-gold/30 bg-black/40 p-3'>
                {[
                  [unlocked, "Unlocked"],
                  [forging, "In Forging"],
                  [emblems.length - unlocked - forging, "Locked"],
                ].map(([value, label]) => (
                  <div key={label} className='px-2 text-center'>
                    <span className='block font-mono text-lg font-bold text-wheel-gold'>
                      {value}
                    </span>
                    <span className='font-mono text-[9px] uppercase text-wheel-sand/70'>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b border-wheel-sand/60 pb-3'>
          <div
            aria-label='Emblem categories'
            className='flex flex-wrap gap-1.5 font-mono text-base'
          >
            {["All Emblems", "STEM & Craft", "Art & Music", "Voyages"].map(
              (category) => (
                <Button
                  key={category}
                  aria-pressed={filter === category}
                  onClick={() => setFilter(category)}
                  className={`rounded-lg border px-3 py-1 ${filter === category ? "border-wheel-navy bg-wheel-navy text-wheel-cream" : "border-wheel-sand bg-white text-wheel-slate"}`}
                >
                  {category}
                  {category === "All Emblems" ? ` (${emblems.length})` : ""}
                </Button>
              ),
            )}
          </div>
          <span className='font-hand text-wheel-slate'>
            velvet display cabinet
          </span>
        </div>
        {dataError && (
          <p role='alert' className='text-sm text-wheel-terracotta'>
            {dataError}
          </p>
        )}
        <div className='space-y-6 rounded-2xl border-2 border-[#8E733D] bg-[#121A24] p-4 shadow-[inset_0_4px_24px_rgba(0,0,0,0.6),0_12px_32px_rgba(15,23,42,0.25)] md:p-6'>
          <div className='flex flex-wrap justify-between gap-2 border-b border-wheel-gold/20 pb-3'>
            <h3 className='font-serif text-sm font-bold uppercase tracking-wide text-wheel-gold'>
              ✦ Grand Curio Shelf — Life Keepsakes
            </h3>
            <span
              role='status'
              className='font-mono text-[10px] text-wheel-sand/60'
            >
              {visible.length} emblems on display
            </span>
          </div>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {visible.map(({ emblem, status }) => (
              <div key={emblem.id} className='relative'>
                <EmblemCard emblem={emblem} resolvedStatus={status} />
                {canEdit && (
                  <Button
                    aria-label={`Edit ${String(emblem.title ?? "emblem")}`}
                    onClick={() => openEditor(draftFor(emblem))}
                    className='absolute right-3 top-3 rounded-md border border-white/20 bg-wheel-midnight/80 px-2.5 py-1 font-mono text-[10px] text-wheel-cream hover:border-wheel-gold hover:text-wheel-gold'
                  >
                    Edit
                  </Button>
                )}
              </div>
            ))}
          </div>
          {!visible.length && (
            <p className='py-8 text-center text-wheel-sand/70'>
              No emblems found.
            </p>
          )}
        </div>
        <div className='flex flex-wrap justify-between gap-3 rounded-xl border border-wheel-sand bg-wheel-parchment p-4'>
          <p className='font-serif text-base italic text-wheel-slate'>
            “Each emblem carries the day’s weather, the coffee spilled, and the
            courage it took to sit down and begin.”
          </p>
          <span className='font-hand text-wheel-terracotta'>
            curated with love
          </span>
        </div>
      </div>
      <Modal
        open={draft !== null}
        onClose={closeEditor}
        title={draft?.id ? "Edit Emblem" : "Add Emblem"}
      >
        {draft && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveEmblem();
            }}
            className='max-h-[80vh] space-y-4 overflow-y-auto rounded-2xl bg-wheel-cream p-6'
          >
            <h2 className='font-serif text-xl font-bold'>
              {draft.id ? "Edit Emblem" : "Add Emblem"}
            </h2>
            {saveError && (
              <p role='alert' className='text-sm text-wheel-terracotta'>
                {saveError}
              </p>
            )}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {(
                [
                  ["name", "Emblem name"],
                  ["title", "Emblem title"],
                  ["tagline", "Tagline"],
                  ["tags", "Tags"],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className='block font-mono text-sm'>
                  {label}
                  <input
                    required={field === "title" || field === "name"}
                    value={draft[field]}
                    onChange={(event) =>
                      setDraft({ ...draft, [field]: event.target.value })
                    }
                    className='mt-2 block w-full rounded-lg border border-wheel-sand bg-white px-3 py-2'
                  />
                </label>
              ))}
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='relative'>
                <span className='block font-mono text-sm'>Icon</span>
                <Button
                  type='button'
                  aria-expanded={emojiOpen}
                  onClick={() => setEmojiOpen(!emojiOpen)}
                  className='mt-2 flex w-full items-center justify-between rounded-lg border border-wheel-sand bg-white px-3 py-2'
                >
                  <span className='text-2xl'>{draft.icon}</span>
                  <span className='font-mono text-base text-wheel-slate'>
                    Choose emoji ▾
                  </span>
                </Button>
                {emojiOpen && (
                  <div className='absolute left-0 top-full z-30 mt-2 w-[min(22rem,80vw)] rounded-xl border border-wheel-border bg-wheel-card p-3 shadow-card-lift'>
                    <input
                      autoFocus
                      value={emojiSearch}
                      onChange={(event) => setEmojiSearch(event.target.value)}
                      placeholder='Find the perfect emoji'
                      className='mb-3 w-full rounded-lg border border-wheel-border bg-wheel-parchment px-3 py-2 text-sm'
                    />
                    <div className='grid max-h-52 grid-cols-6 gap-1 overflow-y-auto'>
                      {emojiChoices
                        .filter(([, keywords]) =>
                          keywords.includes(emojiSearch.trim().toLowerCase()),
                        )
                        .map(([emoji, keywords]) => (
                          <Button
                            type='button'
                            title={keywords}
                            aria-label={keywords}
                            key={emoji}
                            onClick={() => {
                              setDraft({ ...draft, icon: emoji });
                              setEmojiOpen(false);
                              setEmojiSearch("");
                            }}
                            className={`rounded-lg p-2 text-2xl hover:bg-wheel-parchment ${draft.icon === emoji ? "bg-wheel-goldLight" : ""}`}
                          >
                            {emoji}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <label className='block font-mono text-sm'>
                Theme color
                <div className='mt-2 flex gap-2'>
                  <select
                    value={
                      themeChoices.some(([color]) => color === draft.theme)
                        ? draft.theme
                        : "custom"
                    }
                    onChange={(event) =>
                      event.target.value !== "custom" &&
                      setDraft({ ...draft, theme: event.target.value })
                    }
                    className='min-w-0 flex-1 rounded-lg border border-wheel-sand bg-white px-3 py-2'
                  >
                    {themeChoices.map(([color, name]) => (
                      <option key={color} value={color}>
                        {name}
                      </option>
                    ))}
                    <option value='custom'>Custom</option>
                  </select>
                  <input
                    aria-label='Custom theme color'
                    type='color'
                    value={
                      /^#[0-9a-f]{6}$/i.test(draft.theme)
                        ? draft.theme
                        : "#c59a45"
                    }
                    onChange={(event) =>
                      setDraft({ ...draft, theme: event.target.value })
                    }
                    className='h-10 w-12 cursor-pointer rounded-md border border-wheel-sand bg-white p-1'
                  />
                </div>
              </label>
            </div>
            <label className='block font-mono text-sm'>
              Category
              <select
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value })
                }
                className='mt-2 block w-full rounded-lg border border-wheel-sand bg-white px-3 py-2'
              >
                <option>STEM & Craft</option>
                <option>Art & Music</option>
                <option>Voyages</option>
              </select>
            </label>
            <label className='block font-mono text-sm'>
              Description
              <textarea
                rows={3}
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                className='mt-2 block w-full rounded-lg border border-wheel-sand bg-white px-3 py-2'
              />
            </label>
            <div className='grid grid-cols-1 gap-3'>
              <MultiLinkSelector
                label='Quests'
                value={draft.questIds}
                options={quests.flatMap((item) =>
                  item.id
                    ? [
                        {
                          id:
                            String(item.id).split("/").at(-1) ??
                            String(item.id),
                          name: item.title,
                        },
                      ]
                    : [],
                )}
                onChange={(value) => setDraft({ ...draft, questIds: value })}
              />
              <MultiLinkSelector
                label='Chapters'
                value={draft.chapterIds}
                options={chapters.map((item) => ({
                  id: item.id,
                  name: item.name,
                }))}
                onChange={(value) => setDraft({ ...draft, chapterIds: value })}
              />
              <MultiLinkSelector
                label='Chronicles'
                value={draft.chronicleIds}
                options={chronicles.map((item) => ({
                  id: item.id,
                  name: item.title,
                }))}
                onChange={(value) =>
                  setDraft({ ...draft, chronicleIds: value })
                }
              />
            </div>
            <p className='rounded-lg border border-wheel-border bg-wheel-parchment p-3 text-base text-wheel-slate'>
              Status and acquisition are calculated automatically from the
              linked records.
            </p>
            <div className='flex justify-end gap-3'>
              <Button type='button' onClick={closeEditor}>
                Cancel
              </Button>
              <Button
                type='submit'
                className='rounded-lg bg-wheel-navy px-4 py-2 text-wheel-cream'
              >
                Save Emblem
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </ScreenFrame>
  );
}
