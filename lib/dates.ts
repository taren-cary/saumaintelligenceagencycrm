const DAY_MS = 24 * 60 * 60 * 1000;

/** "3 days ago", "in 5 days", "today", "yesterday", "tomorrow" */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return "—";

  const target = new Date(date);
  const now = new Date();

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / DAY_MS);

  if (dayDiff === 0) return "today";
  if (dayDiff === 1) return "tomorrow";
  if (dayDiff === -1) return "yesterday";
  if (dayDiff > 1 && dayDiff < 7) return `in ${dayDiff} days`;
  if (dayDiff < -1 && dayDiff > -7) return `${Math.abs(dayDiff)} days ago`;

  const isPast = dayDiff < 0;
  const abs = Math.abs(dayDiff);

  if (abs < 30) {
    const weeks = Math.round(abs / 7);
    return isPast ? `${weeks} week${weeks > 1 ? "s" : ""} ago` : `in ${weeks} week${weeks > 1 ? "s" : ""}`;
  }
  if (abs < 365) {
    const months = Math.round(abs / 30);
    return isPast ? `${months} month${months > 1 ? "s" : ""} ago` : `in ${months} month${months > 1 ? "s" : ""}`;
  }
  const years = Math.round(abs / 365);
  return isPast ? `${years} year${years > 1 ? "s" : ""} ago` : `in ${years} year${years > 1 ? "s" : ""}`;
}

export function formatAbsoluteDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Days from now until the given date (negative if in the past) */
export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null;
  const target = new Date(date);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / DAY_MS);
}
