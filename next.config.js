import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev"; /**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

/** @type {import("next").NextConfig} */
const config = {
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/auth/:path*",
        headers: [
          { key: "Access-Control-Allow-Headers", value: "*" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/sign-in",
        has: [
          {
            type: "cookie",
            key: "__Secure-kedai.session_token",
          },
        ],
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/:pages*",
        missing: [
          {
            type: "cookie",
            key: "__Secure-kedai.session_token",
          },
          {
            type: "cookie",
            key: "kedai.session_token",
          },
        ],
        destination: "/",
        permanent: false,
      },
      {
        source: "/no-organization/:pages*",
        missing: [
          {
            type: "cookie",
            key: "__Secure-kedai.session_token",
          },
          {
            type: "cookie",
            key: "kedai.session_token",
          },
        ],
        destination: "/",
        permanent: false,
      },
    ];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return config;
  },
};

export default config;
