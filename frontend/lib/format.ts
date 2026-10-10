const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "PHP";

const moneyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: CURRENCY,
});

export const money = (n: number) => moneyFormat.format(n);

/** Parse YYYY-MM-DD as a local date (new Date("2026-10-01") would shift by timezone). */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const formatDate = (s: string) =>
  parseDate(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function monthName(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long" });
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Add calendar months, clamping the day. Mirrors the backend's add_months. */
export function addMonths(d: Date, n: number): Date {
  const result = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(d.getDate(), lastDay));
  return result;
}

export const STATUS_LABEL = {
  paid: "Paid",
  overdue: "Overdue",
  due_soon: "Due soon",
  upcoming: "Upcoming",
} as const;

export const PURCHASE_STATUS_LABEL = {
  active: "In progress",
  overdue: "Overdue",
  completed: "Paid off",
} as const;
