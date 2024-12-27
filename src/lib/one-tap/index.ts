/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { z } from "zod";
import { type BetterAuthPlugin, createAuthEndpoint } from "better-auth/plugins";
import { setSessionCookie } from "better-auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const statusCode = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  "I'M_A_TEAPOT": 418,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511,
};

type Status = keyof typeof statusCode;

class APIError extends Error {
  status: Status;
  headers: Headers;
  body: Record<string, any>;

  constructor(status: Status, body?: Record<string, any>, headers?: Headers) {
    super(`API Error: ${status} ${body?.message ?? ""}`, {
      cause: body,
    });

    this.status = status;
    this.body = body ?? {};
    this.stack = "";

    this.headers = headers ?? new Headers();
    if (!this.headers.has("Content-Type")) {
      this.headers.set("Content-Type", "application/json");
    }
    this.name = "BetterCallAPIError";
  }
}

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
}

type GoogleInfo = {
  email: string;
  email_verified: string;
  name: string;
  picture: string;
  sub: string;
};

export const runtime = "edge";

export const oneTap = (options?: OneTapOptions) =>
  ({
    id: "one-tap",
    endpoints: {
      oneTapCallback: createAuthEndpoint(
        "/one-tap/callback",
        {
          method: "POST",
          body: z.object({
            idToken: z.string(),
          }),
        },
        async (c) => {
          const { idToken } = c.body;
          const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
          );
          const data: GoogleInfo = await response.json();

          if (!data) {
            throw new APIError("BAD_REQUEST", {
              message: "Invalid Token",
            });
          }

          const user = await c.context.internalAdapter.findUserByEmail(
            data.email,
          );
          if (!user) {
            if (options?.disableSignup) {
              throw new APIError("BAD_GATEWAY", {
                message: "User not found",
              });
            }
            const user = await c.context.internalAdapter.createOAuthUser(
              {
                email: data.email,
                emailVerified: toBoolean(data.email_verified),
                name: data.name,
                image: data.picture,
              },
              {
                providerId: "google",
                accountId: data.sub,
              },
            );
            if (!user) {
              throw new APIError("INTERNAL_SERVER_ERROR", {
                message: "Could not create user",
              });
            }
            const session = await c.context.internalAdapter.createSession(
              user?.user.id,
              c.request,
            );
            await setSessionCookie(c, {
              user: user.user,
              session,
            });
            return c.json({
              session,
              user,
            });
          }
          const session = await c.context.internalAdapter.createSession(
            user.user.id,
            c.request,
          );

          await setSessionCookie(c, {
            user: user.user,
            session,
          });
          return c.json({
            session,
            user,
          });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
