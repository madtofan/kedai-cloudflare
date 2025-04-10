"use client";

import Image from "next/image";
import { betterFetch } from "@better-fetch/fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TRPCError } from "@trpc/server";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "~/hooks/use-toast";
import { type RouterOutputs, type RouterInputs } from "~/server/api/root";
import { api } from "~/trpc/react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import imageCompression from "browser-image-compression";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export interface Menu {
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

const formSchema = z.object({
  menuGroupId: z.string(),
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

export function MenuForm({
  handleClose,
  open,
  initialMenu,
}: {
  handleClose: () => void;
  open: boolean;
  initialMenu: Menu | null;
}) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialMenu?.image ?? null,
  );
  const [resetImage, setResetImage] = useState(true);
  const [imageFile, setImageFile] = useState<File>();
  const [loadingImage, setLoadingImage] = useState(false);
  const utils = api.useUtils();

  const { data: stores, isLoading: isLoadingStores } =
    api.store.getAllStore.useQuery();

  const { data: selectOptions } = api.menuGroup.getAllMenuGroup.useQuery();

  const { mutateAsync: addMenu } = api.menu.addMenu.useMutation();

  const { mutateAsync: editMenu } = api.menu.editMenu.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      menuGroupId: initialMenu?.menuGroupId ?? undefined,
      name: initialMenu?.name ?? "",
      description: initialMenu?.description ?? undefined,
      image: undefined,
      sale: initialMenu?.sale ?? 0.0,
      cost: initialMenu?.cost ?? 0.0,
      stores: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!initialMenu) {
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
        .then((uploadUrl) => {
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
          Promise.allSettled([
            utils.store.getAllStoreWithMenu.invalidate(),
            utils.menu.getMenu.invalidate(),
          ])
            .then(() => {
              handleClose();
            })
            .catch(() => {
              toast({
                title: "Error",
                description:
                  "Failed to invalidate data, please refresh to get the latest data",
                variant: "destructive",
              });
            });
        })
        .catch((error: TRPCError) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        });
      return;
    }
    let menuDetails: RouterInputs["menu"]["editMenu"] = {
      id: initialMenu.id,
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
    editMenu(menuDetails)
      .then((uploadUrl) => {
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
          description: `You have successfully updated a menu ${values.name}.`,
        });
        form.reset();
        setImagePreview(null);
        Promise.allSettled([
          utils.store.getAllStoreWithMenu.invalidate(),
          utils.menu.getMenu.invalidate(),
        ])
          .then(() => {
            handleClose();
          })
          .catch(() => {
            toast({
              title: "Error",
              description:
                "Failed to invalidate data, please refresh to get the latest data",
              variant: "destructive",
            });
          });
      })
      .catch((error: TRPCError) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  const updateStores = (newStoreArray: string[]) => {
    form.setValue("stores", newStoreArray);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialMenu ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the menu item. Click save when you&apos;re
            done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
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
                    <FormLabel>Group</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Item description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Cost price per unit</FormDescription>
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
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Selling price per unit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center gap-4">
                      {imagePreview && (
                        <div className="relative h-[80px] w-[80px] overflow-hidden rounded-md">
                          <Image
                            src={imagePreview}
                            alt="Profile preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex w-full items-center gap-2">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          key={`${resetImage}`}
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
                  <FormDescription>
                    Upload a square image for best results
                  </FormDescription>
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

            <DialogFooter>
              <Button type="submit">
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {initialMenu ? "Save Changes" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
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
      </DialogContent>
    </Dialog>
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
