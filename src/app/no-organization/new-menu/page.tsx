"use client";

import { ImageOff, Trash } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useMemo, useState } from "react";
import { type TRPCError } from "@trpc/server";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Spinner } from "~/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/hooks/use-toast";
import { MenuForm } from "~/components/add-menu-form";
import { VerticalContainer } from "~/components/ui/container";
import Link from "next/link";

interface Menu {
  createdAt: Date;
  updatedAt: Date | null;
  menuGroupId?: number;
  menuGroupName?: string;
  menuDetailsId: number;
  id: number;
  name: string;
  sale: number;
  cost: number;
  image: string | null;
  description: string | null;
}

export default function NewMenuPage() {
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const utils = api.useUtils();

  const { data: organizationMenus, isFetching: loadingMenus } =
    api.menu.getMenu.useQuery();

  const { mutateAsync: deleteMenu } = api.menu.deleteMenu.useMutation();

  const menuItems: Menu[] = useMemo(() => {
    if (!organizationMenus) {
      return [];
    }
    const menus = organizationMenus.map((menu) => ({
      ...menu.menuDetails,
      id: menu.id,
      menuDetailsId: menu.menuDetails.id,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
      menuGroupName: menu.menuGroups?.name,
      menuGroupId: menu.menuGroups?.id,
    }));
    return menus;
  }, [organizationMenus]);

  const onDeleteItem = (
    menuId: number,
    setDeleteLoading: (load: boolean) => void,
  ) => {
    setDeleteLoading(true);
    deleteMenu({
      id: menuId,
    })
      .then(() => {
        return Promise.allSettled([
          utils.menu.getMenu.invalidate(),
          utils.store.getStoreMenus.invalidate(),
          utils.store.getAllStoreWithMenu.invalidate(),
        ]);
      })
      .then(() => {
        toast({
          title: "Removed menu",
          description: "You have successfully removed the menu.",
        });
      })
      .catch((error: TRPCError) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      })
      .finally(() => setDeleteLoading(false));
  };

  const renderMenus = () => {
    if (!organizationMenus && loadingMenus) {
      return (
        <div className="flex flex-wrap gap-4">
          <Skeleton className="min-w-[600px] max-w-[800px] flex-grow bg-sidebar" />
          <Skeleton className="min-w-[600px] max-w-[800px] flex-grow bg-sidebar" />
          <Skeleton className="min-w-[600px] max-w-[800px] flex-grow bg-sidebar" />
          <Skeleton className="min-w-[600px] max-w-[800px] flex-grow bg-sidebar" />
          <Skeleton className="min-w-[600px] max-w-[800px] flex-grow bg-sidebar" />
          <Skeleton className="min-w-[600px] max-w-[800px] flex-grow bg-sidebar" />
        </div>
      );
    }

    if (menuItems.length === 0) {
      return (
        <div className="flex justify-center text-center">
          Your organization currently have no menu.
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-4">
        {menuItems.map((item) => (
          <MenuItem key={item.id} menu={item} onDeleteItem={onDeleteItem} />
        ))}
      </div>
    );
  };

  return (
    <main>
      <Sheet
        open={sheetOpen}
        onOpenChange={(state) => {
          setSheetOpen(state);
        }}
      >
        <div className="mb-6 flex flex-row justify-between rounded-lg bg-sidebar p-4 shadow">
          <div className="grid grid-flow-col gap-4">
            <h2 className="self-center text-lg font-semibold">
              Initialization Wizard
            </h2>
            <p className="self-center">Lets add menu to your store!</p>
          </div>
          <div className="grid grid-flow-col gap-4">
            <SheetTrigger asChild>
              <Button variant="default">Add New Menu</Button>
            </SheetTrigger>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                {menuItems.length === 0 ? "Skip" : "Done"}
              </Link>
            </Button>
          </div>
        </div>
        <SheetContent className="bg-sidebar">
          <SheetHeader>
            <SheetTitle>Add New Menu Item</SheetTitle>
            <SheetDescription className="hidden">
              Sheet to display add menu form
            </SheetDescription>
          </SheetHeader>
          <MenuForm onFormSubmit={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <VerticalContainer>
        <ScrollArea className="h-[calc(100vh-200px)] justify-center">
          {renderMenus()}
        </ScrollArea>
      </VerticalContainer>
    </main>
  );
}

const MAX_RETRIES = 1;

function MenuItem({
  menu,
  onDeleteItem,
}: {
  menu: Menu;
  onDeleteItem: (
    itemId: number,
    setDeleteLoading: (load: boolean) => void,
  ) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [image, setImage] = useState(menu.image);
  const [retries, setRetries] = useState(0);
  const [deleteItemLoading, setDeleteItemLoading] = useState(false);

  const renderImage = () => {
    if (!image) {
      return (
        <div className="flex h-40 w-40 items-center justify-center rounded-md bg-primary/10 shadow">
          <ImageOff />
        </div>
      );
    }
    return (
      <>
        {isLoading && (
          <Skeleton className="absolute h-40 w-40 rounded-md object-cover shadow" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element*/}
        <img
          src={image}
          key={`${menu.id}_${retries}`}
          alt={`${menu.name} preview`}
          className="h-40 w-40 rounded-md object-cover shadow"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            if (retries >= MAX_RETRIES) {
              setImage(null);
              return;
            }
            setTimeout(function () {
              setRetries((prev) => prev + 1);
            }, 2000);
          }}
        />
      </>
    );
  };

  return (
    <Card className="min-w-[600px] max-w-[800px] flex-grow bg-sidebar">
      <CardHeader className="flex flex-row justify-between">
        <div>
          <CardTitle>{menu.name}</CardTitle>
          <CardDescription>{menu.description}</CardDescription>
        </div>
        <div className="pl-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteItem(menu.id, setDeleteItemLoading)}
            disabled={deleteItemLoading}
          >
            {deleteItemLoading ? <Spinner /> : <Trash className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-row justify-between">
        <div className="flex flex-row justify-between">
          <div>
            <p>price: </p>
            <p>cost: </p>
            <p>group: </p>
          </div>
          <div className="ml-4">
            <p>{menu.sale}</p>
            <p>{menu.cost}</p>
            <p>{menu.menuGroupName}</p>
          </div>
        </div>
        <div>{renderImage()}</div>
      </CardContent>
    </Card>
  );
}
