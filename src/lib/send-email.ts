"server-only";

import { betterFetch } from "@better-fetch/fetch";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { env } from "~/env";

export function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  getRequestContext().ctx.waitUntil(
    betterFetch<{ success: boolean; messageId: string; message: string }>(
      env.EMAIL_API_ENDPOINT,
      {
        method: "POST",
        headers: {
          "X-API-Key": env.EMAIL_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          html,
        }),
      },
    ),
  );
}
