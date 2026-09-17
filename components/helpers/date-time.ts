const KUALA_LUMPUR_OFFSET = "+08:00";

export function startOfKualaLumpurDay(date: string) {
  return `${date.slice(0, 10)}T00:00:00${KUALA_LUMPUR_OFFSET}`;
}

export function endOfKualaLumpurDay(date: string) {
  return `${date.slice(0, 10)}T23:59:59${KUALA_LUMPUR_OFFSET}`;
}

export function kualaLumpurDate(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function normalizeKualaLumpurBoundary(
  value: unknown,
  boundary: "start" | "end",
) {
  const text = String(value ?? "");
  const legacy =
    boundary === "start"
      ? /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/
      : /^\d{4}-\d{2}-\d{2}T23:59:59(?:\.999)?Z$/;
  if (legacy.test(text)) {
    return boundary === "start"
      ? startOfKualaLumpurDay(text)
      : endOfKualaLumpurDay(text);
  }
  return text;
}
