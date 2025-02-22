import { api } from "~/trpc/server";
import { type ReactNode } from "react";
import { MenuProvider } from "./_provider";

type ParamType = Promise<{
  organizationSlug: string;
  storeSlug: string;
  tableNumber: string;
}>;

export async function generateMetadata({ params }: { params: ParamType }) {
  const { organizationSlug, storeSlug } = await params;

  const menu = await api.store
    .getStoreMenus({ organizationSlug, storeSlug })
    .catch(() => {
      return { name: "", storeMenus: [] };
    });

  return {
    title: !menu.name ? "Store not found" : menu.name,
    description: "POS System for Malaysian Restaurants",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
  };
}

export default async function MenuLayout({
  params,
  children,
}: {
  params: ParamType;
  children: ReactNode;
}) {
  const { organizationSlug, storeSlug, tableNumber } = await params;
  const menu = await api.store
    .getStoreMenus({ organizationSlug, storeSlug })
    .catch(() => {
      return { name: "", storeMenus: [] };
    });

  return (
    <MenuProvider
      menu={menu}
      table={tableNumber}
      organization={organizationSlug}
      store={storeSlug}
    >
      {children}
    </MenuProvider>
  );
}
