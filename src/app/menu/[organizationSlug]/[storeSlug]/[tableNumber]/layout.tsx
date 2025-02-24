import { api } from "~/trpc/server";
import { type ReactNode } from "react";
import { MenuProvider } from "./_provider";
import { type TRPCError } from "@trpc/server";

export type ParamType = Promise<{
  organizationSlug: string;
  storeSlug: string;
  tableNumber: string;
}>;

export async function generateMetadata({ params }: { params: ParamType }) {
  const { organizationSlug, storeSlug } = await params;

  const menu = await api.store
    .getStoreMenus({ organizationSlug, storeSlug })
    .catch((err: TRPCError) => {
      if (err.code === "FORBIDDEN") {
        return { name: "", isOpen: false, storeMenus: [] };
      }
      return { name: "", isOpen: true, storeMenus: [] };
    });

  return {
    title: menu.isOpen
      ? !menu.name
        ? "Store not found"
        : menu.name
      : "Store is currently closed!",
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
    .catch((err: TRPCError) => {
      if (err.code === "FORBIDDEN") {
        return { name: "", isOpen: false, storeMenus: [] };
      }
      return { name: "", isOpen: true, storeMenus: [] };
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
