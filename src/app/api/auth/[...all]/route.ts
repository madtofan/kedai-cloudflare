import { getRequestContext } from "@cloudflare/next-on-pages";
import { type NextRequest } from "next/server";
import { auth } from "~/lib/auth";

export const runtime = "edge";

const handler = async (req: NextRequest) => {
  return auth(getRequestContext().env as Env).handler(req);
};

export { handler as GET, handler as POST };
