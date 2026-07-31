const DAY_MS = 86_400_000;

function calendarValue(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day));
}

export function trialDaysRemaining(trialEndsAt: string | null, timezone = "America/Santiago") {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.round((calendarValue(end, timezone) - calendarValue(new Date(), timezone)) / DAY_MS));
}
