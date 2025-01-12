"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronDown, ImageOff, Plus, Trash, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import Image from "next/image";
import { api } from "~/trpc/react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type TRPCError } from "@trpc/server";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
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
import { type RouterOutputs, type RouterInputs } from "~/server/api/root";
import { betterFetch } from "@better-fetch/fetch";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useToast } from "~/hooks/use-toast";

const formSchema = z.object({
  menuGroupId: z.coerce.number().positive(),
  name: z.string().min(1).max(256),
  description: z.string().max(256).optional(),
  image: z
    .object({
      fileSize: z.number(),
      fileType: z.string(),
    })
    .optional(),
  sale: z.coerce.number(),
  cost: z.coerce.number(),
  stores: z.array(z.string()),
});

interface Menu {
  createdAt: Date;
  updatedAt: Date;
  menuGroupId: number;
  menuGroupName: string;
  menuDetailsId: number;
  id: number;
  name: string;
  sale: number;
  cost: number;
  image: string | null;
  description: string | null;
}

export default function DashboardMenuPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resetImage, setResetImage] = useState(true);
  const [imageFile, setImageFile] = useState<File>();
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingAddMenu, setLoadingAddMenu] = useState(false);
  const utils = api.useUtils();

  const { data: stores, isLoading: isLoadingStores } =
    api.store.getAllStore.useQuery();

  const { data: selectOptions, error: menuGroupError } =
    api.menuGroup.getAllMenuGroup.useQuery();

  const {
    data: organizationMenus,
    isFetching: loadingMenus,
    error: menuError,
  } = api.menu.getMenu.useQuery();

  const { mutateAsync: addMenu } = api.menu.addMenu.useMutation();

  const { mutateAsync: deleteMenu } = api.menu.deleteMenu.useMutation();

  useEffect(() => {
    if (
      menuError?.data?.code === "FORBIDDEN" ||
      menuGroupError?.data?.code === "FORBIDDEN"
    ) {
      router.push("/dashboard/organization");
    }
  }, [menuError?.data?.code, menuGroupError?.data?.code, router]);

  const menuItems: Menu[] = useMemo(() => {
    if (!organizationMenus) {
      return [];
    }
    const menus = organizationMenus.flatMap((menuGroup) =>
      menuGroup.menus.map((menu) => ({
        ...menu.menuDetails,
        id: menu.id,
        menuDetailsId: menu.menuDetails.id,
        createdAt: menu.createdAt,
        updatedAt: menu.menuDetails.createdAt,
        menuGroupName: menuGroup.name,
        menuGroupId: menuGroup.id,
      })),
    );
    return menus;
  }, [organizationMenus]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      menuGroupId: undefined,
      name: "",
      description: undefined,
      image: undefined,
      sale: 0.0,
      cost: 0.0,
      stores: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setLoadingAddMenu(true);
    let menuDetails: RouterInputs["menu"]["addMenu"] = {
      menuGroupId: values.menuGroupId,
      name: values.name,
      description: values.description ?? "",
      sale: values.sale,
      cost: values.cost,
      stores: values.stores,
    };
    if (values.image) {
      menuDetails = {
        ...menuDetails,
        image: values.image,
      };
    }
    addMenu(menuDetails)
      .then(async (uploadUrl) => {
        if (uploadUrl && imageFile && values.image?.fileType) {
          betterFetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": values.image?.fileType,
            },
            body: imageFile,
          }).catch(() => {
            toast({
              title: "Error",
              description: "Failed to upload image.",
              variant: "destructive",
            });
          });
        }
        toast({
          title: "Success!",
          description: `You have successfully added a new menu ${values.name}.`,
        });
        form.reset();
        setImagePreview(null);
        setSheetOpen(false);
        await Promise.allSettled([
          utils.store.getAllStoreWithMenu.invalidate(),
          utils.menu.getMenu.invalidate(),
        ]);
      })
      .catch((error: TRPCError) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      })
      .finally(() => setLoadingAddMenu(false));
  };

  const updateStores = (newStoreArray: string[]) => {
    form.setValue("stores", newStoreArray);
  };

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
          <h2 className="text-lg font-semibold">Menu</h2>
          <div>
            <SheetTrigger asChild>
              <Button>Add New Menu</Button>
            </SheetTrigger>
          </div>
        </div>
        <SheetContent className="bg-sidebar">
          <SheetHeader>
            <SheetTitle>Add New Menu Item</SheetTitle>
            <SheetDescription className="hidden">
              Sheet to display add menu form
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-background"
                        key={`${sheetOpen}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center gap-4">
                        {imagePreview && (
                          <div className="relative h-16 w-16 overflow-hidden rounded-sm">
                            <Image
                              src={imagePreview}
                              alt="Profile preview"
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        )}
                        <div className="flex w-full items-center gap-2">
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            key={`${sheetOpen}_${resetImage}`}
                            className="w-full"
                            onChange={(e) => {
                              setLoadingImage(true);
                              const file = e.target.files?.[0];
                              if (file) {
                                imageCompression(file, {
                                  maxSizeMB: 1,
                                  maxWidthOrHeight: 1920,
                                  useWebWorker: false,
                                })
                                  .then((compressedFile) => {
                                    const previewUrl =
                                      URL.createObjectURL(compressedFile);
                                    setImagePreview(previewUrl);
                                    setImageFile(compressedFile);
                                    form.setValue("image", {
                                      fileSize: compressedFile.size,
                                      fileType: compressedFile.type,
                                    });
                                  })
                                  .catch(() => {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description:
                                        "An error occured loading the selected image.",
                                    });
                                  })
                                  .finally(() => {
                                    setLoadingImage(false);
                                  });
                              }
                            }}
                          />
                          {field.value && (
                            <X
                              className="cursor-pointer"
                              onClick={() => {
                                form.setValue("image", undefined);
                                setImagePreview(null);
                                setResetImage((prev) => !prev);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-background"
                        key={`${sheetOpen}`}
                        type="number"
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-background"
                        key={`${sheetOpen}`}
                        type="number"
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none bg-background"
                        key={`${sheetOpen}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="menuGroupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Menu Group</FormLabel>
                    <Select onValueChange={field.onChange} key={`${sheetOpen}`}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a group for this menu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectOptions?.map((item) => (
                          <SelectItem key={item.id} value={`${item.id}`}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <StoreSelector
                stores={stores}
                initialSelectedStore={form.getValues("stores")}
                updateStores={updateStores}
                isLoadingStores={isLoadingStores}
              />
              <div className="flex items-end"></div>
              <SheetFooter>
                <Button type="submit" disabled={loadingAddMenu}>
                  {loadingAddMenu ? (
                    <Spinner />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Item
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <ScrollArea className="h-[calc(100vh-200px)] justify-center">
        {renderMenus()}
      </ScrollArea>
      <Dialog open={loadingImage}>
        <DialogTitle className="hidden">System</DialogTitle>
        <DialogDescription className="hidden">
          Loading Image Dialog when user selects a new image
        </DialogDescription>
        <DialogContent
          disableClose={true}
          className="flex max-w-60 flex-row place-content-center items-center"
        >
          <Spinner />
          Loading Image
        </DialogContent>
      </Dialog>
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

function StoreSelector({
  stores,
  initialSelectedStore,
  updateStores,
  isLoadingStores,
}: {
  stores?: RouterOutputs["store"]["getAllStore"];
  initialSelectedStore: string[];
  updateStores: (newStores: string[]) => void;
  isLoadingStores: boolean;
}) {
  const [selectedStores, setSelectedStores] =
    useState<string[]>(initialSelectedStore);

  useEffect(() => {
    const allStoresId = stores?.map((store) => store.id) ?? [];
    setSelectedStores(allStoresId);
    updateStores(allStoresId);
  }, [stores, updateStores]);

  const generateStoreText = useCallback(() => {
    if (!selectedStores || selectedStores.length === 0) {
      return `Menu is not added to any stores`;
    }

    if (selectedStores.length === stores?.length) {
      return `Add menu to all stores`;
    }

    if (selectedStores.length === 1) {
      return `Menu is added to ${stores?.find((store) => store.id === selectedStores[0])?.name}`;
    }

    return `Menu is added to ${selectedStores.length}`;
  }, [selectedStores, stores]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={!stores || isLoadingStores}
          className="justify-between"
        >
          {!stores && isLoadingStores ? (
            <>
              <span>Loading Stores</span>
              <Spinner />
            </>
          ) : (
            <>
              <span>{generateStoreText()}</span>
              <ChevronDown />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-max">
        <DropdownMenuCheckboxItem
          key="all-stores"
          className="capitalize"
          checked={stores?.length === selectedStores.length}
          onCheckedChange={(value) => {
            const newSelectedStores = value
              ? (stores?.map((store) => store.id) ?? [])
              : [];
            updateStores(newSelectedStores);
            setSelectedStores(newSelectedStores);
          }}
        >
          All Stores
        </DropdownMenuCheckboxItem>
        {stores?.map((store) => {
          const checked = selectedStores.includes(store.id);
          return (
            <DropdownMenuCheckboxItem
              key={`${store.slug}_${checked}`}
              className="capitalize"
              checked={checked}
              onCheckedChange={(value) => {
                const newSelectedStores = value
                  ? [...selectedStores, store.id]
                  : selectedStores.filter((selected) => selected !== store.id);
                setSelectedStores(newSelectedStores);
                updateStores(newSelectedStores);
              }}
            >
              {store.name}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
