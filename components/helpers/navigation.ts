// Stable IDs keep in-screen links independent of navigation order.
export const screenNavigation = [
  { id: "screen-7", label: "Create Quest" },
  { id: "screen-8", label: "Chapters" },
  { id: "screen-3", label: "Chronicles" },
  { id: "screen-4", label: "Canon" },
  { id: "screen-5", label: "Hall of Emblems" },
] as const;
export const defaultScreen = "screen-6";
export const workspaceNavigation = [
  ...screenNavigation,
  { id: "screen-1", label: "Chapter Detail" },
  { id: "screen-2", label: "Quest Detail" },
  { id: "screen-6", label: "Due Dates Radar" },
] as const;
