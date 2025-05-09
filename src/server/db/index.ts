import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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
   * Don't call getCloudflareContext() at the top level
   */
  client = globalForDb.client ?? getCloudflareContext().env.DB;

  return drizzle(client, { schema });
};
