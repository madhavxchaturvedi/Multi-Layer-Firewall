// utils.js — re-exports from ds.js for backwards compatibility
import { clsx } from "clsx";
export {
  CATEGORY_LABEL,
  CAT_COLORS as CATEGORY_COLOR,
  SEV_COLORS as SEVERITY_COLOR,
} from "./ds";

export function cn(...args) {
  return clsx(...args);
}

export function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
