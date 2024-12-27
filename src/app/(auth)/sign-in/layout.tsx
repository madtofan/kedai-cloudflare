import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

export default async function Page({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth(getRequestContext().env as Env).api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full">
      <div className="flex w-full flex-col items-center justify-center md:py-10">
        {children}
      </div>
    </div>
  );
}
