/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { APIError, type BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/plugins";

function toBoolean(value: any): boolean {
  return value === "true" || value === true;
}

interface OneTapOptions {
  /**
   * Disable the signup flow
   *
   * @default false
   */
  disableSignup?: boolean;
  /**
   * Google Client ID
   *
   * If a client ID is provided in the social provider configuration,
   * it will be used.
   */
  clientId?: string;
}

export const oneTap = (options?: OneTapOptions) =>
  ({
    id: "one-tap",
    endpoints: {
      oneTapCallback: createAuthEndpoint(
        "/one-tap/callback",
        {
          method: "POST",
          body: z.object({
            idToken: z.string({
              description:
                "Google ID token, which the client obtains from the One Tap API",
            }),
          }),
          metadata: {
            openapi: {
              summary: "One tap callback",
              description:
                "Use this endpoint to authenticate with Google One Tap",
              responses: {
                200: {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          session: {
                            $ref: "#/components/schemas/Session",
                          },
                          user: {
                            $ref: "#/components/schemas/User",
                          },
                        },
                      },
                    },
                  },
                },
                400: {
                  description: "Invalid token",
                },
              },
            },
          },
        },
        async (ctx) => {
          const { idToken } = ctx.body;
          let payload: any;
          try {
            const JWKS = createRemoteJWKSet(
              new URL("https://www.googleapis.com/oauth2/v3/certs"),
            );
            console.log({ idToken });
            const { payload: verifiedPayload } = await jwtVerify(
              idToken,
              JWKS,
              {
                issuer: ["https://accounts.google.com", "accounts.google.com"],
                audience:
                  options?.clientId ??
                  ctx.context.options.socialProviders?.google?.clientId,
              },
            );
            payload = verifiedPayload;
            console.log({ verifiedPayload });
          } catch (error) {
            console.log(error);
            throw new APIError("BAD_REQUEST", {
              message: "invalid id token",
            });
          }
          const { email, email_verified, name, picture, sub } = payload;
          if (!email) {
            return ctx.json({ error: "Email not available in token" });
          }

          const user = await ctx.context.internalAdapter.findUserByEmail(email);
          if (!user) {
            if (options?.disableSignup) {
              throw new APIError("BAD_GATEWAY", {
                message: "User not found",
              });
            }
            const newUser = await ctx.context.internalAdapter.createOAuthUser(
              {
                email,
                emailVerified:
                  typeof email_verified === "boolean"
                    ? email_verified
                    : toBoolean(email_verified),
                name,
                image: picture,
              },
              {
                providerId: "google",
                accountId: sub,
              },
              ctx,
            );
            if (!newUser) {
              throw new APIError("INTERNAL_SERVER_ERROR", {
                message: "Could not create user",
              });
            }
            const session = await ctx.context.internalAdapter.createSession(
              newUser.user.id,
              ctx.request,
            );
            // await setSessionCookie(ctx, {
            // 	user: newUser.user,
            // 	session,
            // });
            return ctx.json({
              token: session.token,
              user: {
                id: newUser.user.id,
                email: newUser.user.email,
                emailVerified: newUser.user.emailVerified,
                name: newUser.user.name,
                image: newUser.user.image,
                createdAt: newUser.user.createdAt,
                updatedAt: newUser.user.updatedAt,
              },
            });
          }
          const account = await ctx.context.internalAdapter.findAccount(sub);
          if (!account) {
            const accountLinking = ctx.context.options.account?.accountLinking;
            const shouldLinkAccount =
              accountLinking?.enabled &&
              (accountLinking.trustedProviders?.includes("google") ??
                email_verified);
            if (shouldLinkAccount) {
              await ctx.context.internalAdapter.linkAccount({
                userId: user.user.id,
                providerId: "google",
                accountId: sub,
                scope: "openid,profile,email",
                idToken,
              });
            } else {
              throw new APIError("UNAUTHORIZED", {
                message: "Google sub doesn't match",
              });
            }
          }
          const session = await ctx.context.internalAdapter.createSession(
            user.user.id,
            ctx.request,
          );

          // await setSessionCookie(ctx, {
          // 	user: user.user,
          // 	session,
          // });
          return ctx.json({
            token: session.token,
            user: {
              id: user.user.id,
              email: user.user.email,
              emailVerified: user.user.emailVerified,
              name: user.user.name,
              image: user.user.image,
              createdAt: user.user.createdAt,
              updatedAt: user.user.updatedAt,
            },
          });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
