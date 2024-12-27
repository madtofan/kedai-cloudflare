import { getRequestContext } from "@cloudflare/next-on-pages";
import { type NextRequest } from "next/server";
import { auth } from "~/lib/auth";

export const runtime = "edge";

const handler = async (req: NextRequest) => {
  // req.headers.append("Access-Control-Allow-Origin", "*");
  // req.headers.append(
  //   "Access-Control-Allow-Headers",
  //   "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  // );
  // req.headers.append(
  //   "Access-Control-Allow-Methods",
  //   "GET,DELETE,PATCH,POST,PUT",
  // );
  // req.headers.append("Access-Control-Allow-Credentials", "true");
  // const newHeaders = req.headers;
  // newHeaders.set("Access-Control-Allow-Origin", "*");
  return auth(getRequestContext().env as Env).handler(req);
};

export { handler as GET, handler as POST };
