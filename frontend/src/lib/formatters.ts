import { format, formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

function toDate(value: Date | string) {
  return typeof value === "string" ? parseISO(value) : value;
}

export function formatCurrency(value: number, currency: string = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: Date | string, pattern: string = "dd/MM/yyyy HH:mm") {
  return format(toDate(value), pattern, { locale: vi });
}

export function formatRelativeTime(value: Date | string) {
  return formatDistanceToNow(toDate(value), {
    addSuffix: true,
    locale: vi,
  });
}
