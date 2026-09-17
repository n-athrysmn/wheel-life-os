import type { ReactNode } from "react";
import { screenNavigation } from "../helpers/navigation";
import { Button } from "./ui";
import { useWheel } from "./wheel-provider";

const dockIcons: Record<string, { tone: string; drawing: ReactNode }> = {
  "screen-7": {
    tone: "radar",
    drawing: (
      <>
        <rect x='6' y='4' width='20' height='24' rx='4' />
        <path d='M16 10v12m-6-6h12' />
      </>
    ),
  },
  "screen-1": {
    tone: "chapter",
    drawing: (
      <>
        <path d='M7 5h16a2 2 0 0 1 2 2v20H9a3 3 0 0 1-3-3V7a2 2 0 0 1 1-2Z' />
        <path d='M10 5v22M15 11h6M15 16h5' />
        <path
          d='m18 21 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.8 1 .3-2-1.5-1.4 2-.3Z'
          fill='currentColor'
          stroke='none'
        />
      </>
    ),
  },
  "screen-2": {
    tone: "quest",
    drawing: (
      <>
        <path d='M8 27V5m1 1c5-5 10 5 16 0v13c-6 5-11-5-16 0' />
        <path d='m14 12 2 2 4-4' />
      </>
    ),
  },
  "screen-3": {
    tone: "library",
    drawing: (
      <>
        <rect x='4' y='8' width='6' height='19' rx='1.5' />
        <rect x='12' y='5' width='6' height='22' rx='1.5' />
        <path d='m20 8 5-1 4 19-5 1Z' />
        <path d='M5 22h4m4-1h4m-4-10h4' />
      </>
    ),
  },
  "screen-8": {
    tone: "chapter",
    drawing: (
      <>
        <rect x='6' y='5' width='20' height='22' rx='2' />
        <path d='M10 10h12M10 15h12M10 20h8' />
        <path d='M3 9h6M3 15h6M3 21h6' />
      </>
    ),
  },
  "screen-4": {
    tone: "map",
    drawing: (
      <>
        <path d='m4 8 8-3 8 3 8-3v21l-8 3-8-3-8 3Z' />
        <path d='M12 5v21m8-18v21' />
        <path d='m8 17 4-3 6 4 6-6' strokeDasharray='2 3' />
      </>
    ),
  },
  "screen-5": {
    tone: "emblems",
    drawing: (
      <>
        <path d='m10 5 6 9 6-9M6 5h6l4 6 4-6h6l-8 12' />
        <circle cx='16' cy='22' r='7' />
        <path
          d='m16 18 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.2-2.4 1.2.5-2.6-1.9-1.8 2.6-.4Z'
          fill='currentColor'
          stroke='none'
        />
      </>
    ),
  },
};

export function Dock() {
  const { view, setView, closeChapterEditor } = useWheel();
  return (
    <nav aria-label='Wheel screens' className='wheel-dock'>
      {screenNavigation.map(({ id, label }) => {
        const icon = dockIcons[id];
        const name = label.replace("⏰ ", "");
        const active = view === id;
        return (
          <Button
            key={id}
            aria-label={name}
            aria-current={active ? "page" : undefined}
            aria-pressed={active}
            className='dock-item'
            onClick={() => {
              if (id === "screen-8") closeChapterEditor();
              setView(id);
            }}
          >
            <span className='dock-tooltip' aria-hidden='true'>
              {name}
            </span>
            <span
              className={`dock-icon dock-icon-${icon.tone}`}
              aria-hidden='true'
            >
              <svg
                viewBox='0 0 32 32'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.65'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                {icon.drawing}
              </svg>
            </span>
            <span className='dock-indicator' aria-hidden='true' />
          </Button>
        );
      })}
    </nav>
  );
}
