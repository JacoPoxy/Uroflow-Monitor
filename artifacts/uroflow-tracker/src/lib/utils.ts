import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatClinicalDateTime(dateString: string) {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  } catch (e) {
    return dateString;
  }
}

export function formatClinicalDate(dateString: string) {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy");
  } catch (e) {
    return dateString;
  }
}
