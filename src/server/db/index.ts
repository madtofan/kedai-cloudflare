import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export const runtime = "edge";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
export interface Env {
  DB: D1Database;
}

const globalForDb = globalThis as unknown as {
  client?: D1Database;
};

export let client: D1Database | undefined;

export const db = () => {
  /**
   * Don't call getRequestContext() at the top level
   */
  client = globalForDb.client ?? (getRequestContext().env as Env).DB;

  return drizzle(client, { schema });
};
