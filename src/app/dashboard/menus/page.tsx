"use client";

import {
  ArrowUpDown,
  ImageOff,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
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
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/hooks/use-toast";
import { type Menu, MenuForm } from "~/components/add-menu-form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export default function DashboardMenuPage() {
  const { toast } = useToast();
  const utils = api.useUtils();

  const [initialMenuForm, setInitialMenuForm] = useState<Menu | null>(null);
  const [openMenuForm, setOpenMenuForm] = useState(false);
  const [menuGroupFilter, setMenuGroupFilter] = useState("all");
  const [search, setSearch] = useState("");

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

  const { data: menuGroups, isLoading: loadingMenuGroups } =
    api.menuGroup.getAllMenuGroup.useQuery();

  const { data: organizationMenus, isLoading: loadingMenus } =
    api.menu.getMenu.useQuery();

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
    <div className="min-h-screen space-y-4 bg-muted/40 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage your restaurant&apos;s menu items
            </p>
          </div>
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

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      Name
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <MenuTableBody
                  handleDeleteItem={onDeleteItem}
                  handleEditMenu={onEditItem}
                  menuItems={menuItems}
                  loadingMenus={loadingMenus}
                  filteredItems={filteredItems}
                />
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="grid gap-4 md:hidden">
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

        {openMenuForm && (
          <MenuForm
            open={openMenuForm}
            handleClose={() => setOpenMenuForm(false)}
            initialMenu={initialMenuForm}
          />
        )}
      </div>
    </div>
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

interface MenuTableBodyProps {
  handleEditMenu: (menu: Menu) => void;
  handleDeleteItem: (menuId: number) => Promise<void>;
  menuItems: Menu[];
  filteredItems: Menu[];
  loadingMenus: boolean;
}

const MenuTableBody = ({
  handleEditMenu,
  handleDeleteItem,
  menuItems,
  filteredItems,
  loadingMenus,
}: MenuTableBodyProps) => {
  if (loadingMenus) {
    return (
      <TableRow>
        <TableCell>
          <Skeleton className="flex-grow" />
        </TableCell>
        <TableCell>
          <Skeleton className="flex-grow" />
        </TableCell>
        <TableCell>
          <Skeleton className="flex-grow" />
        </TableCell>
        <TableCell>
          <Skeleton className="flex-grow" />
        </TableCell>
        <TableCell>
          <Skeleton className="flex-grow" />
        </TableCell>
        <TableCell>
          <Skeleton className="flex-grow" />
        </TableCell>
        <TableCell>
          <Skeleton className="flex-grow" />
        </TableCell>
      </TableRow>
    );
  }

  if (menuItems.length === 0) {
    return (
      <TableRow className="flex justify-center text-center">
        Your organization currently have no menu.
      </TableRow>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <TableRow className="flex justify-center p-4 text-center">
        <TableCell colSpan={7}>
          Oops! We searched the kitchen, but couldn&apos;t find that particular
          craving.
        </TableCell>
      </TableRow>
    );
  }

  return filteredItems.map((item) => (
    <MenuTableRow
      item={item}
      handleDelete={handleDeleteItem}
      handleEdit={handleEditMenu}
      key={item.id}
    />
  ));
};

interface MenuItemProps {
  item: Menu;
  handleDelete: (menuId: number) => Promise<void>;
  handleEdit: (menu: Menu) => void;
}

const MenuTableRow = ({ item, handleDelete, handleEdit }: MenuItemProps) => {
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
    <TableRow>
      <TableCell>
        <MenuImage menu={item} />
      </TableCell>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="max-w-[200px] truncate">
        {item.description}
      </TableCell>
      <TableCell className="capitalize">{item.menuGroupName}</TableCell>
      <TableCell className="text-right">${item.cost.toFixed(2)}</TableCell>
      <TableCell className="text-right">${item.sale.toFixed(2)}</TableCell>
      <TableCell className="text-right">
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
      </TableCell>
    </TableRow>
  );
};

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
