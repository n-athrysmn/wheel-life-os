import { Button, Card } from "./ui";
import { useWheel } from "./wheel-provider";
import { Modal } from "./modal";
export function ChapterCelebration() {
  const { celebrating, setCelebrating, chapter, openCreateChapter } =
    useWheel();
  return (
    <Modal
      open={celebrating}
      onClose={() => setCelebrating(false)}
      title='Chronicle complete'
    >
      <div className='bg-linear-to-b from-[#FFFDF9] to-[#FAF5EB] border-2 border-wheel-gold max-w-xl w-full rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden'>
        <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-36 h-7 washi-tape rotate-1 rounded flex items-center justify-center shadow-sm'>
          <span className='text-[11px] font-hand text-wheel-navy font-bold tracking-wider'>
            {"chronicle complete"}
          </span>
        </div>
        <div className='text-center space-y-2 mt-3'>
          <span className='text-3xl'>{"\ud83c\udf1f"}</span>
          <h3 className='font-serif text-2xl md:text-3xl font-bold text-wheel-ink'>
            {"CHAPTER COMPLETE"}
          </h3>
          <p className='font-serif text-lg text-wheel-navy italic font-semibold'>
            {chapter.name}
          </p>
          <p className='font-serif italic text-wheel-slate text-sm max-w-md mx-auto'>
            {
              "\u201cYou don't have to finish every quest for the chronicle to have mattered.\u201d"
            }
          </p>
        </div>

        <Card className='my-6 space-y-3 bg-white/90 border border-wheel-border rounded-xl p-4 shadow-sm text-base'>
          <div className='flex justify-between items-center py-1.5 border-b border-wheel-sand/60'>
            <span className='text-wheel-slate font-serif'>
              {"Quests Explored"}
            </span>
            <span className='font-mono font-bold text-wheel-ink'>
              {"4 Quests Active"}
            </span>
          </div>
          <div className='flex justify-between items-center py-1.5 border-b border-wheel-sand/60'>
            <span className='text-wheel-slate font-serif'>
              {"Nilai Murni / Values Collected"}
            </span>
            <span className='font-semibold text-wheel-sage font-mono'>
              {"Keberanian, Amanah Komuniti"}
            </span>
          </div>
          <div className='flex justify-between items-center py-1.5 border-b border-wheel-sand/60'>
            <span className='text-wheel-slate font-serif'>
              {"Key Lessons Recorded"}
            </span>
            <span className='font-serif italic text-wheel-ink'>
              {"1 Fellowship Insight noted"}
            </span>
          </div>
          <div className='flex justify-between items-center py-1.5'>
            <span className='text-wheel-slate font-serif'>
              {"Emblem Unlocked"}
            </span>
            <span className='font-mono font-bold text-wheel-gold flex items-center gap-1'>
              <span>{"\u269b\ufe0f"}</span>
              {"Micro-Sensor Fellow Pin"}
            </span>
          </div>
        </Card>

        <div className='space-y-2 mb-6'>
          <div className='text-base font-mono font-bold uppercase tracking-wider text-wheel-slate'>
            {"Choose where quests go next:"}
          </div>
          <div className='grid grid-cols-3 gap-2 text-center text-base'>
            <div className='p-2 rounded-lg bg-wheel-sage/10 border border-wheel-sage/30 text-wheel-sage font-medium'>
              <span className='block font-bold'>{"1 Complete"}</span>
              <span className='text-[10px] text-wheel-slate'>
                {"STI Portrait Done"}
              </span>
            </div>
            <div className='p-2 rounded-lg bg-wheel-gold/15 border border-wheel-gold/40 text-wheel-ink font-medium'>
              <span className='block font-bold'>{"2 Carry Forward"}</span>
              <span className='text-[10px] text-wheel-slate'>
                {"Into October"}
              </span>
            </div>
            <div className='p-2 rounded-lg bg-wheel-parchment border border-wheel-sand text-wheel-slate font-medium'>
              <span className='block font-bold'>{"1 Return to Map"}</span>
              <span className='text-[10px] text-wheel-slate'>
                {"Safe on shelf"}
              </span>
            </div>
          </div>
        </div>
        <div className='flex items-center justify-end gap-3'>
          <Button
            onClick={() => setCelebrating(false)}
            className='px-4 py-2 rounded-xl text-base font-serif text-wheel-slate hover:text-wheel-ink'
          >
            {"Review Later"}
          </Button>
          <Button
            onClick={() => {
              setCelebrating(false);
              openCreateChapter();
            }}
            className='px-5 py-2.5 rounded-xl text-base font-serif font-bold bg-wheel-navy text-wheel-cream hover:bg-wheel-ink shadow-md transition-all'
          >
            {"Seal Chronicle & Begin Anew \u2192"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
