import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    BETTER_AUTH_SECRET: z.string(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_IMAGE_BASE_PATH: z.string().url(),
    CLOUDFLARE_D1_ID: z.string(),
    CLOUDFLARE_D1_TOKEN: z.string(),
    CLOUDFLARE_R2_BUCKET_NAME: z.string(),
    CLOUDFLARE_R2_ID: z.string(),
    CLOUDFLARE_R2_TOKEN: z.string(),
    EMAIL_API_ENDPOINT: z.string(),
    EMAIL_API_KEY: z.string(),
    GOOGLE_AUTH_SECRET: z.string(),
    NODE_ENV: z
      .enum(["development", "preview", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_ENV: z.string().optional(),
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url(),
    NEXT_PUBLIC_GOOGLE_AUTH_ID: z.string(),
    NEXT_PUBLIC_LOCAL_DB: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_IMAGE_BASE_PATH: process.env.CLOUDFLARE_IMAGE_BASE_PATH,
    CLOUDFLARE_D1_ID: process.env.CLOUDFLARE_D1_ID,
    CLOUDFLARE_D1_TOKEN: process.env.CLOUDFLARE_D1_TOKEN,
    CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    CLOUDFLARE_R2_ID: process.env.CLOUDFLARE_R2_ID,
    CLOUDFLARE_R2_TOKEN: process.env.CLOUDFLARE_R2_TOKEN,
    GOOGLE_AUTH_SECRET: process.env.GOOGLE_AUTH_SECRET,
    EMAIL_API_ENDPOINT: process.env.EMAIL_API_ENDPOINT,
    EMAIL_API_KEY: process.env.EMAIL_API_KEY,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    NEXT_PUBLIC_GOOGLE_AUTH_ID: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ID,
    NEXT_PUBLIC_LOCAL_DB: process.env.NEXT_PUBLIC_LOCAL_DB,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
