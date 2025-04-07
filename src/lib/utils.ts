import { getCloudflareContext } from "@opennextjs/cloudflare";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function asyncGetEnv() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "test"
  ) {
    return process.env as unknown as CloudflareEnv;
  }
  const { env } = await getCloudflareContext({ async: true });
  return env;
}
