"use client";

import { ImageOff, MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useMemo, useState } from "react";
import { type TRPCError } from "@trpc/server";
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
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import Link from "next/link";

interface Menu {
  createdAt: Date;
  updatedAt: Date | null;
  menuGroupId?: string;
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
  const [openMenuForm, setOpenMenuForm] = useState(false);
  const [initialMenuForm, setInitialMenuForm] = useState<Menu | null>(null);
  const [menuGroupFilter, setMenuGroupFilter] = useState("all");
  const [search, setSearch] = useState("");
  const utils = api.useUtils();

  const { data: menuGroups, isLoading: loadingMenuGroups } =
    api.menuGroup.getAllMenuGroup.useQuery();

  const { data: organizationMenus, isFetching: loadingMenus } =
    api.menu.getMenu.useQuery();

  const { mutateAsync: deleteMenu } = api.menu.deleteMenu.useMutation({
    onSuccess() {
      Promise.allSettled([
        utils.menu.getMenu.invalidate(),
        utils.store.getStoreMenus.invalidate(),
        utils.store.getAllStoreWithMenu.invalidate(),
      ])
        .then(() => {
          toast({
            title: "Removed menu",
            description: "You have successfully removed the menu.",
          });
        })
        .catch(() => {
          toast({
            title: "Error",
            description:
              "Failed to invalidate cache, please refresh to get the latest data",
            variant: "destructive",
          });
        });
    },
    onError(error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const filteredItems = useMemo(
    () =>
      menuItems.filter((item) => {
        const matchesSearch = item.name
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesGroup =
          menuGroupFilter === "all"
            ? true
            : item.menuGroupId === menuGroupFilter;
        return matchesSearch && matchesGroup;
      }),
    [menuGroupFilter, menuItems, search],
  );

  const onDeleteItem = async (menuId: number) => {
    await deleteMenu({
      id: menuId,
    });
  };

  const onEditItem = (menu: Menu) => {
    setInitialMenuForm(menu);
    setOpenMenuForm(true);
  };

  return (
    <main>
      <div className="mb-6 flex flex-row justify-between rounded-lg bg-sidebar p-4 shadow">
        <div className="grid grid-flow-col gap-4">
          <h2 className="self-center text-lg font-semibold">
            Initialization Wizard
          </h2>
          <p className="self-center">Lets add menu to your store!</p>
        </div>
        <div className="grid grid-flow-col gap-4">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              {menuItems.length === 0 ? "Skip" : "Done"}
            </Link>
          </Button>
          {openMenuForm && (
            <MenuForm
              open={openMenuForm}
              handleClose={() => setOpenMenuForm(false)}
              initialMenu={initialMenuForm}
            />
          )}
        </div>
      </div>
      <VerticalContainer>
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={menuGroupFilter}
            onValueChange={setMenuGroupFilter}
            disabled={loadingMenuGroups}
          >
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {menuGroups?.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setInitialMenuForm(null);
              setOpenMenuForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)] justify-center">
          <div className="grid gap-4">
            {!loadingMenus ? (
              menuItems.length === 0 ? (
                <span className="m-auto mt-9 w-max">
                  Your organization currently have no menu. Lets fix that by
                  pressing Add Menu Item button
                </span>
              ) : filteredItems.length === 0 ? (
                <span className="m-auto mt-9 w-max">
                  Oops! We searched the kitchen, but couldn&apos;t find that
                  particular craving.
                </span>
              ) : (
                filteredItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    handleDelete={onDeleteItem}
                    handleEdit={onEditItem}
                  />
                ))
              )
            ) : (
              <>
                <Skeleton className="w-max rounded-md" />
                <Skeleton className="w-max rounded-md" />
              </>
            )}
          </div>
        </ScrollArea>
      </VerticalContainer>
    </main>
  );
}

const MAX_RETRIES = 1;

function MenuImage({ menu }: { menu: Menu }) {
  const [isLoading, setIsLoading] = useState(true);
  const [image, setImage] = useState(menu.image);
  const [retries, setRetries] = useState(0);

  if (!image) {
    return (
      <div className="flex h-[50px] w-[50px] items-center justify-center rounded-md bg-primary/10 object-cover shadow">
        <ImageOff />
      </div>
    );
  }
  return (
    <>
      {isLoading && (
        <Skeleton className="absolute h-[50px] w-[50px] rounded-md object-cover shadow" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element*/}
      <img
        src={image}
        key={`${menu.id}_${retries}`}
        alt={`${menu.name} preview`}
        className="h-[50px] w-[50px] rounded-md object-cover shadow"
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
}

interface MenuItemProps {
  item: Menu;
  handleDelete: (menuId: number) => Promise<void>;
  handleEdit: (menu: Menu) => void;
}

const MenuCard = ({ item, handleDelete, handleEdit }: MenuItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const onDeleteClick = () => {
    setIsDeleting(true);
    handleDelete(item.id)
      .catch((err: TRPCError) => console.error(err.message))
      .finally(() => setIsDeleting(false));
  };

  const onEditClick = () => {
    handleEdit(item);
  };

  return (
    <Card key={item.id}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <MenuImage menu={item} />
            <div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {item.description}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEditClick} disabled={isDeleting}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isDeleting}
                className="text-destructive"
                onClick={onDeleteClick}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Group:</span>
            <p className="font-medium capitalize">{item.menuGroupName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Cost:</span>
            <p className="font-medium">${item.cost.toFixed(2)}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Sale Price:</span>
            <p className="font-medium">${item.sale.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
