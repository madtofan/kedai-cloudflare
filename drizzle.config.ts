import { defineConfig } from "drizzle-kit";

import { env } from "~/env";

export default !env.NEXT_PUBLIC_LOCAL_DB
  ? defineConfig({
      schema: "./src/server/db/schema.ts",
      out: "./drizzle",
      dialect: "sqlite",
      driver: "d1-http",
      dbCredentials: {
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        databaseId: env.CLOUDFLARE_D1_ID,
        token: env.CLOUDFLARE_D1_TOKEN,
      },
    })
  : defineConfig({
      schema: "./src/server/db/schema.ts",
      dialect: "sqlite",
      dbCredentials: {
        url: env.NEXT_PUBLIC_LOCAL_DB,
      },
    });
