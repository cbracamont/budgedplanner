import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
npm install @react-pdf/renderer html2canvas date-fns sonner
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
