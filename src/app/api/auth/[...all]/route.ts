import { type NextRequest } from "next/server";
import { auth } from "~/lib/auth";

const handler = async (req: NextRequest) => {
  return auth.handler(req);
};

export { handler as GET, handler as POST };
