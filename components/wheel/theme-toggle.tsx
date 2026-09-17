import { useSyncExternalStore } from "react";
import { Button } from "./ui";

const themeEvent = "wheel-theme-change";
export type WheelTheme = "light" | "dark";
export function normalizeWheelTheme(value: unknown): WheelTheme {
  return value === "dark" || value === "night" ? "dark" : "light";
}
export function setWheelTheme(value: WheelTheme) {
  document.documentElement.setAttribute("data-theme", value);
  try {
    localStorage.setItem("wheel-theme", value);
  } catch {
    /* Theme still applies if storage is unavailable. */
  }
  window.dispatchEvent(new Event(themeEvent));
}
function subscribe(callback: () => void) {
  window.addEventListener(themeEvent, callback);
  const syncStorage = (event: StorageEvent) => {
    if (event.key === "wheel-theme" || event.key === null) {
      document.documentElement.setAttribute(
        "data-theme",
        event.newValue === "dark" ? "dark" : "light",
      );
      callback();
    }
  };
  window.addEventListener("storage", syncStorage);
  return () => {
    window.removeEventListener(themeEvent, callback);
    window.removeEventListener("storage", syncStorage);
  };
}
function getTheme(): WheelTheme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
export function ThemeToggle({
  onChange,
}: {
  onChange?: (theme: WheelTheme) => void;
}) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  function chooseTheme(value: WheelTheme) {
    setWheelTheme(value);
  }
  return (
    <fieldset className='space-y-2'>
      <legend className='text-sm font-medium'>Appearance</legend>
      <div className='grid grid-cols-2 gap-2'>
        {(["light", "dark"] as const).map((value) => (
          <Button
            key={value}
            aria-pressed={theme === value}
            onClick={() => {
              chooseTheme(value);
              onChange?.(value);
            }}
            className={`px-4 py-3 rounded-xl border text-sm ${theme === value ? "bg-wheel-navy text-wheel-cream border-wheel-gold" : "bg-wheel-parchment text-wheel-ink border-wheel-sand"}`}
          >
            {value === "light" ? "☀ Light" : "☾ Dark"}
          </Button>
        ))}
      </div>
      <p className='text-base text-wheel-slate'>
        Your appearance preference is saved to your Wheel profile and this
        device.
      </p>
    </fieldset>
  );
}
