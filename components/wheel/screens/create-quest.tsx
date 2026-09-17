import { SubQuestFields } from "../sub-quest-fields";
import { useState } from "react";
import { Button, Card, ScreenFrame } from "../ui";
import { useWheel } from "../wheel-provider";
import { RichTextEditor } from "../rich-text-editor";
import {
  questTags,
  questComponents,
  type QuestConfiguration,
} from "../../helpers/quest-definition";
const emptyConfiguration = (): QuestConfiguration => ({
  tags: [],
  components: [],
  subQuests: [],
  rating: 0,
  notes: "",
  pros: "",
  cons: "",
  moralValues: "",
  lessonLearned: "",
  lore: "",
  scraps: [],
  artifacts: [],
  keepsakes: [],
});
export function CreateQuest() {
  const { createQuest, chapters, setView, setNotice, setMapFilter } =
    useWheel();
  const [chapterId, setChapterId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [locations, setLocations] = useState("");
  const [rating, setRating] = useState(0);
  const [tagDraft, setTagDraft] = useState("");
  const [config, setConfig] = useState(emptyConfiguration);
  const field =
    "block w-full mt-2 rounded-lg border border-wheel-sand bg-white px-3 py-2 text-sm text-wheel-ink";
  const has = (component: (typeof questComponents)[number]) =>
    config.components.includes(component);
  return (
    <ScreenFrame path='wheel.app / quests / new' title='Create Quest'>
      <form
        className='p-6 md:p-8 space-y-6'
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          if (
            has("Side quest") &&
            config.subQuests.some((item) => !item.title.trim())
          ) {
            setNotice(
              "Please give every side quest a title, or remove the empty entry.",
            );
            return;
          }
          const saved = {
            ...config,
            subQuests: has("Side quest")
              ? config.subQuests.map((item) => ({
                  ...item,
                  title: item.title.trim(),
                  note: item.note.trim(),
                }))
              : [],
            rating,
            notes: has("Notes") ? config.notes.trim() : "",
            pros: has("Pros and cons") ? config.pros.trim() : "",
            cons: has("Pros and cons") ? config.cons.trim() : "",
            moralValues: has("Moral values") ? config.moralValues.trim() : "",
            lessonLearned: has("Lesson learned")
              ? config.lessonLearned.trim()
              : "",
            lore: has("Lore") ? config.lore.trim() : "",
            scraps: has("Scraps") ? config.scraps.filter(Boolean) : [],
            artifacts: has("Artifacts")
              ? (config.artifacts ?? []).filter(Boolean)
              : [],
            keepsakes: has("Keepsakes")
              ? (config.keepsakes ?? []).filter(Boolean)
              : [],
          };
          createQuest({
            title: title.trim(),
            subtitle: subtitle.trim() || undefined,
            tags: config.tags,
            locations: locations
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
            rating,
            images: saved.scraps.map((url) => ({
              id: crypto.randomUUID(),
              url,
              sourceType: "quest",
            })),
            artifacts: saved.artifacts.map((url) => ({
              id: crypto.randomUUID(),
              url,
              kind: "artifact" as const,
            })),
            keepsakes: saved.keepsakes.map((url) => ({
              id: crypto.randomUUID(),
              url,
              kind: "keepsake" as const,
            })),
            description: description.trim(),
            note: description.trim(),
            status: chapterId ? "ACTIVE" : "PLANNING",
            chapterId: chapterId || undefined,
            dueDate: dueDate || undefined,
            configuration: saved,
          });
          setNotice(`“${title.trim()}” has been added to Canon.`);
          setTitle("");
          setSubtitle("");
          setDescription("");
          setChapterId("");
          setDueDate("");
          setLocations("");
          setRating(0);
          setTagDraft("");
          setConfig(emptyConfiguration());
          setMapFilter("All");
          setView("screen-4");
        }}
      >
        <div>
          <p className='font-mono text-base uppercase tracking-wider text-wheel-sage'>
            A new possibility
          </p>
          <h2 className='font-serif text-3xl font-bold mt-1'>Create a Quest</h2>
          <p className='text-sm text-wheel-slate mt-2'>
            Give it a name, choose its tags, and add the parts that matter to
            you.
          </p>
        </div>
        <Card className='bg-white border border-wheel-border rounded-xl p-5 space-y-5 shadow-paper'>
          <label className='block text-sm font-semibold'>
            Title
            <input
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder='e.g. A winter in Seoul'
              className={field}
            />
          </label>
          <label className='block text-sm font-semibold'>
            Subtitle
            <input
              maxLength={160}
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              placeholder='e.g. Winter expedition'
              className={field}
            />
          </label>
          <label className='block text-sm font-semibold'>
            Description
            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder='What is this quest about, and why does it matter to you?'
              className={field}
            />
          </label>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <label className='block text-sm font-semibold'>
              Chapter (optional)
              <select
                value={chapterId}
                onChange={(event) => setChapterId(event.target.value)}
                className={field}
              >
                <option value=''>No chapter — keep on Canon</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </label>
            <label className='block text-sm font-semibold'>
              Quest due date (optional)
              <input
                type='date'
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={field}
              />
            </label>
          </div>
          <fieldset>
            <legend className='text-sm font-semibold mb-2'>Tags</legend>
            <div className='flex flex-wrap gap-2'>
              {questTags.map((tag) => (
                <Button
                  key={tag}
                  aria-pressed={config.tags.includes(tag)}
                  onClick={() =>
                    setConfig({
                      ...config,
                      tags: config.tags.includes(tag)
                        ? config.tags.filter((item) => item !== tag)
                        : [...config.tags, tag],
                    })
                  }
                  className={`px-3 py-1.5 rounded-full border text-base capitalize ${config.tags.includes(tag) ? "bg-wheel-navy text-wheel-cream border-wheel-gold" : "bg-wheel-parchment text-wheel-slate border-wheel-sand"}`}
                >
                  {tag}
                </Button>
              ))}
              {config.tags
                .filter(
                  (tag) => !(questTags as readonly string[]).includes(tag),
                )
                .map((tag) => (
                  <Button
                    key={tag}
                    aria-label={`Remove ${tag} tag`}
                    onClick={() =>
                      setConfig({
                        ...config,
                        tags: config.tags.filter((item) => item !== tag),
                      })
                    }
                    className='rounded-full border border-wheel-gold bg-wheel-navy px-3 py-1.5 text-base capitalize text-wheel-cream'
                  >
                    {tag} ×
                  </Button>
                ))}
            </div>
            <div className='mt-3 flex max-w-md gap-2'>
              <input
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  const tag = tagDraft.trim().toLowerCase();
                  if (tag && !config.tags.includes(tag))
                    setConfig({ ...config, tags: [...config.tags, tag] });
                  setTagDraft("");
                }}
                placeholder='Add another tag'
                className={field.replace("mt-2", "mt-0")}
              />
              <Button
                onClick={() => {
                  const tag = tagDraft.trim().toLowerCase();
                  if (tag && !config.tags.includes(tag))
                    setConfig({ ...config, tags: [...config.tags, tag] });
                  setTagDraft("");
                }}
                className='shrink-0 rounded-lg border border-wheel-sand bg-wheel-parchment px-4 text-sm'
              >
                + Add
              </Button>
            </div>
          </fieldset>
          <label className='block text-sm font-semibold'>
            Locations (optional)
            <span className='mt-1 block text-base font-normal text-wheel-slate'>
              Separate multiple locations with commas.
            </span>
            <input
              value={locations}
              onChange={(event) => setLocations(event.target.value)}
              placeholder='Kuala Lumpur, Penang'
              className={field}
            />
          </label>
          <label className='block text-sm font-semibold'>
            Rating
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className={field}
            >
              <option value={0}>Not rated yet</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5 — {"★".repeat(value)}
                </option>
              ))}
            </select>
          </label>
        </Card>
        <fieldset>
          <legend className='font-serif font-bold text-lg'>Components</legend>
          <p className='text-base text-wheel-slate mt-1 mb-3'>
            Choose what this quest needs. You can leave the details blank for
            now.
          </p>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {questComponents.map((component) => (
              <label
                key={component}
                className={`flex gap-2 items-center p-3 rounded-xl border text-sm cursor-pointer ${has(component) ? "border-wheel-gold bg-wheel-goldLight/30" : "border-wheel-border bg-white"}`}
              >
                <input
                  type='checkbox'
                  checked={has(component)}
                  onChange={() =>
                    setConfig({
                      ...config,
                      components: has(component)
                        ? config.components.filter((item) => item !== component)
                        : [...config.components, component],
                    })
                  }
                  className='accent-wheel-sage'
                />
                {component}
              </label>
            ))}
          </div>
        </fieldset>
        {config.components.length > 0 && (
          <Card className='bg-white border border-wheel-border rounded-xl p-5 space-y-5 shadow-paper'>
            {has("Lore") && (
              <label className='block text-sm font-medium'>
                Lore
                <textarea
                  rows={4}
                  value={config.lore}
                  onChange={(event) =>
                    setConfig({ ...config, lore: event.target.value })
                  }
                  placeholder='Capture the first story or moment from this quest.'
                  className={field}
                />
              </label>
            )}
            {has("Side quest") && (
              <SubQuestFields
                items={config.subQuests}
                onChange={(subQuests) => setConfig({ ...config, subQuests })}
              />
            )}
            {has("Notes") && (
              <div>
                <p className='mb-2 text-sm font-medium'>Notes</p>
                <RichTextEditor
                  value={config.notes}
                  onChange={(notes) => setConfig({ ...config, notes })}
                />
              </div>
            )}
            {has("Pros and cons") && (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <label className='block text-sm font-medium'>
                  Pros
                  <textarea
                    rows={3}
                    value={config.pros}
                    onChange={(event) =>
                      setConfig({ ...config, pros: event.target.value })
                    }
                    className={field}
                  />
                </label>
                <label className='block text-sm font-medium'>
                  Cons
                  <textarea
                    rows={3}
                    value={config.cons}
                    onChange={(event) =>
                      setConfig({ ...config, cons: event.target.value })
                    }
                    className={field}
                  />
                </label>
              </div>
            )}
            {has("Moral values") && (
              <label className='block text-sm font-medium'>
                Moral values
                <textarea
                  rows={3}
                  value={config.moralValues}
                  onChange={(event) =>
                    setConfig({ ...config, moralValues: event.target.value })
                  }
                  className={field}
                />
              </label>
            )}
            {has("Lesson learned") && (
              <label className='block text-sm font-medium'>
                Lesson learned
                <textarea
                  rows={3}
                  value={config.lessonLearned}
                  onChange={(event) =>
                    setConfig({ ...config, lessonLearned: event.target.value })
                  }
                  className={field}
                />
              </label>
            )}
            {has("Scraps") && (
              <label className='block text-sm font-medium'>
                Scrap image URLs
                <span className='mt-1 block text-base font-normal text-wheel-slate'>
                  Enter one image URL per line.
                </span>
                <textarea
                  rows={4}
                  value={config.scraps.join("\n")}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      scraps: event.target.value
                        .split("\n")
                        .map((value) => value.trim()),
                    })
                  }
                  placeholder={
                    "https://example.com/image-one.jpg\nhttps://example.com/image-two.jpg"
                  }
                  className={field}
                />
              </label>
            )}
            {has("Artifacts") && (
              <label className='block text-sm font-medium'>
                Artifact URLs
                <span className='mt-1 block text-base font-normal text-wheel-slate'>
                  Enter one URL per line.
                </span>
                <textarea
                  rows={4}
                  value={(config.artifacts ?? []).join("\n")}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      artifacts: event.target.value
                        .split("\n")
                        .map((value) => value.trim()),
                    })
                  }
                  placeholder='https://drive.google.com/…'
                  className={field}
                />
              </label>
            )}
            {has("Keepsakes") && (
              <label className='block text-sm font-medium'>
                Keepsake URLs
                <span className='mt-1 block text-base font-normal text-wheel-slate'>
                  Enter one URL per line.
                </span>
                <textarea
                  rows={4}
                  value={(config.keepsakes ?? []).join("\n")}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      keepsakes: event.target.value
                        .split("\n")
                        .map((value) => value.trim()),
                    })
                  }
                  placeholder='https://docs.google.com/…'
                  className={field}
                />
              </label>
            )}
          </Card>
        )}
        <div className='flex justify-end gap-3 border-t border-wheel-sand pt-4'>
          <Button
            onClick={() => setView("screen-4")}
            className='text-sm text-wheel-slate'
          >
            Visit Canon
          </Button>
          <Button
            type='submit'
            disabled={!title.trim()}
            className='px-5 py-2.5 bg-wheel-navy text-wheel-cream rounded-xl text-sm font-semibold'
          >
            Create Quest →
          </Button>
        </div>
      </form>
    </ScreenFrame>
  );
}
