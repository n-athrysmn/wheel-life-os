"use client";
import { WheelProvider, useWheel } from "./wheel-provider";
import { workspaceNavigation } from "../helpers/navigation";
import { Dock } from "./dock";
import { Header } from "./header";
import { CurrentChapter } from "./screens/current-chapter";
import { QuestDetail } from "./screens/quest-detail";
import { Chapters } from "./screens/chapters";
import { LifeMap } from "./screens/life-map";
import { ChapterCelebration } from "./chapter-celebration";
import { QuestEditor } from "./quest-controls";
import { HallOfEmblems } from "./screens/hall-of-emblems";
import { DueDatesRadar } from "./screens/due-dates-radar";
import { CreateQuest } from "./screens/create-quest";
import { ChapterIndex } from "./screens/chapter-index";
const screens = {
  "screen-7": CreateQuest,
  "screen-6": DueDatesRadar,
  "screen-1": CurrentChapter,
  "screen-2": QuestDetail,
  "screen-3": Chapters,
  "screen-8": ChapterIndex,
  "screen-4": LifeMap,
  "screen-5": HallOfEmblems,
};
function Workspace() {
  const { view, notice, setNotice } = useWheel();
  const ActiveScreen = screens[view as keyof typeof screens];
  return (
    <>
      <Header />
      <main className='wheel-workspace bg-paper-subtle min-h-screen p-4 md:p-8'>
        {notice && (
          <div
            role='status'
            className='max-w-5xl mx-auto mb-4 p-4 rounded-xl border border-wheel-gold bg-wheel-goldLight flex justify-between gap-4'
          >
            {notice}
            <button
              aria-label='Dismiss notification'
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}
        {view === "side-by-side" && (
          <div className='max-w-7xl mx-auto mb-8 bg-wheel-parchment/70 border border-wheel-border rounded-2xl p-5 shadow-paper'>
            <p className='text-base uppercase tracking-wider text-wheel-sage'>
              Editorial Product System
            </p>
            <h1 className='font-serif text-2xl font-bold'>
              Wheel Life Operating System — Core Architecture
            </h1>
            <p className='text-sm text-wheel-slate mt-1'>
              Chronicle → Quest → Side Quest. Keep track of everything you’re
              becoming.
            </p>
          </div>
        )}
        <div
          className={
            view === "side-by-side"
              ? "grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1900px] mx-auto items-start"
              : "max-w-5xl mx-auto"
          }
        >
          {view === "side-by-side"
            ? workspaceNavigation.map(({ id }) => {
                const Screen = screens[id];
                return (
                  <div key={id}>
                    <Screen />
                  </div>
                );
              })
            : ActiveScreen && <ActiveScreen />}
        </div>
      </main>
      <Dock />
      <ChapterCelebration />
      <QuestEditor />
    </>
  );
}
export function WheelApp() {
  return (
    <WheelProvider>
      <Workspace />
    </WheelProvider>
  );
}
