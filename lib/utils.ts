import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const sameDay = start.toDateString() === end.toDateString();

  const dateFmt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const timeFmt: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

  if (sameDay) {
    return `${start.toLocaleDateString('vi-VN', dateFmt)} · ${start.toLocaleTimeString(
      'vi-VN',
      timeFmt
    )} – ${end.toLocaleTimeString('vi-VN', timeFmt)}`;
  }

  return `${start.toLocaleDateString('vi-VN', dateFmt)} – ${end.toLocaleDateString(
    'vi-VN',
    dateFmt
  )}`;
}
