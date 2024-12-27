import { betterAuth } from "better-auth";
import { oneTap, organization } from "better-auth/plugins";
import { env } from "~/env";
import { sendOrganizationInvitation } from "./email/organization-invitation";
import { D1Dialect } from "kysely-d1";
import { resetPassword } from "./email/reset-password";
import { Kysely } from "kysely";

export const auth = (cloudflareEnv: Env) => {
  return betterAuth({
    advanced: {
      cookiePrefix: "kedai",
      crossSubDomainCookies:
        cloudflareEnv.NODE_ENV === "production"
          ? {
            enabled: true,
            domain: "kedai.madtofan.win",
          }
          : undefined,
    },
    appName: "Kedai",
    database: {
      db: new Kysely({
        dialect: new D1Dialect({
          database: cloudflareEnv.DB,
        }),
      }),
      type: "sqlite",
    },
    account: {
      accountLinking: {
        trustedProviders: ["google"],
      },
    },
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ user, url }) {
        resetPassword({
          email: user.email,
          resetLink: url,
        });
      },
    },
    socialProviders: {
      google: {
        clientId: env.NEXT_PUBLIC_GOOGLE_AUTH_ID,
        clientSecret: env.GOOGLE_AUTH_SECRET,
      },
    },
    plugins: [
      oneTap(),
      organization({
        async sendInvitationEmail(data) {
          const inviteLink = `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/accept-invitation/${data.id}`;
          sendOrganizationInvitation({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          });
        },
      }),
    ],
  });
};

// import { drizzleAdapter } from "better-auth/adapters/drizzle";
// import { createClient } from "@libsql/client";
// import { drizzle } from "drizzle-orm/libsql";
//
// const client = createClient({ url: env.NEXT_PUBLIC_LOCAL_DB! });
// export const auth = betterAuth({
//   session: {
//     cookieCache: {
//       enabled: true,
//       maxAge: 5 * 60, // Cache duration in seconds
//     },
//   },
//   advanced: {
//     cookiePrefix: "kedai",
//   },
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//   database: drizzleAdapter(drizzle(client), {
//     provider: "sqlite", // or "mysql", "sqlite"
//   }),
//   emailAndPassword: {
//     enabled: true,
//   },
//   socialProviders: {
//     google: {
//       clientId: env.NEXT_PUBLIC_GOOGLE_AUTH_ID,
//       clientSecret: env.GOOGLE_AUTH_SECRET,
//     },
//   },
//   plugins: [
//     oneTap(),
//     organization({
//       async sendInvitationEmail(data) {
//         const inviteLink = `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/accept-invitation/${data.id}`;
//         sendOrganizationInvitation({
//           email: data.email,
//           invitedByUsername: data.inviter.user.name,
//           invitedByEmail: data.inviter.user.email,
//           teamName: data.organization.name,
//           inviteLink,
//         });
//       },
//     }),
//   ],
//   trustedOrigins: ["kedai://", "exp://"],
// });
