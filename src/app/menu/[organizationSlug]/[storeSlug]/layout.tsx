import { api } from "~/trpc/server";
import { type ReactNode } from "react";
import { MenuProvider } from "./_provider";

export default async function MenuLayout({
  params,
  children,
}: {
  params: Promise<{ organizationSlug: string; storeSlug: string }>;
  children: ReactNode;
}) {
  const { organizationSlug, storeSlug } = await params;
  const menu = await api.store
    .getStoreMenus({ organizationSlug, storeSlug })
    .catch(() => {
      return { name: "", storeMenus: [] };
    });

  return <MenuProvider menu={menu}>{children}</MenuProvider>;
}
