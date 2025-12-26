import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function joinUrl(baseUrl, path) {
  const normalizedBase = String(baseUrl || "").replace(/\/+$/, "");
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  if (!normalizedBase || !normalizedPath) return "";
  return `${normalizedBase}/${normalizedPath}`;
}

export function getPathAfterBucket(inputUrl) {
  const value = String(inputUrl || "").trim();
  if (!value) return "";

  let pathname = value;
  try {
    pathname = new URL(value).pathname;
  } catch {
    pathname = value;
  }

  const normalized = pathname.replace(/^\/+/, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) return normalized;
  return parts.slice(1).join("/");
}

export function requireEnv(name) {
  const value = import.meta.env?.[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}
