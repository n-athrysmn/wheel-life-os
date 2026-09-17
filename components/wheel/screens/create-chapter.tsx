import { Button, Card, ScreenFrame } from "../ui";
import { useWheel } from "../wheel-provider";
import { QuestPicker } from "../quest-controls";
export function CreateChapter() {
  const {
    draft,
    setDraft,
    selected,
    setAddingQuest,
    beginChapter,
    editingChapter,
  } = useWheel();
  return (
    <ScreenFrame
      path={
        editingChapter
          ? "wheel.app / chapters / revise"
          : "wheel.app / chapters / new"
      }
      title={
        editingChapter ? `Revise Chapter - ${draft.name}` : "Create New Chapter"
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          beginChapter();
        }}
      >
        <div className='p-6 md:p-8 flex-1 flex flex-col space-y-6 bg-[#FCFAF7] custom-scrollbar overflow-y-auto max-h-230'>
          <div>
            <div className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-wheel-gold/15 text-wheel-ink text-base font-mono mb-1'>
              <span>{"\u2726"}</span>
              {"Intentional Chapter Crafting"}
            </div>
            <h2 className='font-serif text-2xl font-bold text-wheel-ink'>
              {editingChapter
                ? "Revise Current Chapter"
                : "Prepare Your Next Chapter"}
            </h2>
            <p className='text-base text-wheel-slate mt-1 max-w-xl'>
              {
                "A chapter gives your next weeks a clear run of execution. Choose what matters for this stretch; the rest waits peacefully on Canon."
              }
            </p>
          </div>

          <Card className='space-y-4 bg-white border border-wheel-border rounded-xl p-5 shadow-sm'>
            <div>
              <label className='block text-base font-mono uppercase tracking-wider text-wheel-slate font-bold mb-1'>
                {"Name This Chapter"}
              </label>
              <input
                type='text'
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                aria-label='name'
                required
                className='w-full text-sm font-serif font-bold text-wheel-ink bg-wheel-parchment/40 border border-wheel-sand rounded-lg px-3.5 py-2 focus:bg-white focus:outline-none focus:border-wheel-gold'
              />
              <span className='text-[11px] text-wheel-slate/80 font-hand text-base'>
                {'e.g. "November \u2014 Quiet Craft", "Spring Expedition"'}
              </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='block text-base font-mono uppercase tracking-wider text-wheel-slate font-bold mb-1'>
                  {"Start Date"}
                </label>
                <input
                  type='date'
                  value={draft.start}
                  onChange={(event) =>
                    setDraft({ ...draft, start: event.target.value })
                  }
                  aria-label='start'
                  required
                  className='w-full text-base font-mono text-wheel-ink bg-wheel-parchment/40 border border-wheel-sand rounded-lg px-3 py-2'
                />
              </div>
              <div>
                <label className='block text-base font-mono uppercase tracking-wider text-wheel-slate font-bold mb-1'>
                  {"End Date (Flexible pacing)"}
                </label>
                <input
                  type='date'
                  value={draft.end}
                  onChange={(event) =>
                    setDraft({ ...draft, end: event.target.value })
                  }
                  aria-label='end'
                  required
                  className='w-full text-base font-mono text-wheel-ink bg-wheel-parchment/40 border border-wheel-sand rounded-lg px-3 py-2'
                  min={draft.start}
                />
              </div>
            </div>

            <div>
              <label className='block text-base font-mono uppercase tracking-wider text-wheel-slate font-bold mb-1'>
                {"What is this chapter about? (Intention)"}
              </label>
              <input
                type='text'
                value={draft.intention}
                onChange={(event) =>
                  setDraft({ ...draft, intention: event.target.value })
                }
                aria-label='intention'
                required
                className='w-full text-base font-sans text-wheel-ink bg-wheel-parchment/40 border border-wheel-sand rounded-lg px-3.5 py-2 focus:bg-white focus:outline-none focus:border-wheel-gold'
              />
            </div>
          </Card>

          <div className='space-y-3'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1'>
              <div>
                <h3 className='font-serif text-sm font-bold text-wheel-ink'>
                  {"Choose Quests to Journey With"}
                </h3>
                <p className='text-base text-wheel-slate'>
                  {
                    "Quest selection is optional. You can add quests whenever this chapter is ready for them."
                  }
                </p>
              </div>

              <div className='text-base font-hand text-wheel-terracotta text-base bg-wheel-terracotta/10 px-2.5 py-0.5 rounded-full border border-wheel-terracotta/20'>
                {
                  "\u201cYou don\u2019t have to do everything this chapter.\u201d"
                }
              </div>
            </div>

            <QuestPicker />

            <Button
              className='w-full py-2.5 border border-dashed border-wheel-sand hover:border-wheel-gold rounded-xl bg-white/60 hover:bg-white text-base font-serif text-wheel-navy transition-all flex items-center justify-center gap-1.5'
              onClick={() => setAddingQuest(true)}
            >
              <span>{"+"}</span>
              <span>{"Sketch a Brand New Quest for this Chapter"}</span>
            </Button>
          </div>

          <div className='pt-2 border-t border-wheel-sand flex items-center justify-between'>
            <div className='text-base'>
              <span className='font-mono font-bold text-wheel-ink'>
                {selected.length} Quests Selected
              </span>
              <span className='text-wheel-slate ml-2 font-serif italic'>
                {"\u2022 Pacing: Balanced & Nourishing"}
              </span>
            </div>
            <Button
              type='submit'
              className='px-4 py-2 bg-wheel-navy text-wheel-cream hover:bg-wheel-ink font-serif text-base rounded-xl shadow-md transition-colors flex items-center gap-1.5'
            >
              <span>
                {editingChapter ? "Set the Plot Anew" : "Seal & Begin Chapter"}
              </span>
              <span>{"\u2192"}</span>
            </Button>
          </div>
        </div>
      </form>
    </ScreenFrame>
  );
}
