"use client";

import {
  Circle,
  CircleOff,
  Folder,
  MoreHorizontal,
  SquareMenu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "./ui/dialog";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface StoreObject {
  id: string;
  name: string;
  url: string;
  orderUrl: string;
  isOpen: boolean | null;
}

export function NavStores({ stores }: { stores: StoreObject[] }) {
  const { isMobile } = useSidebar();
  const { mutateAsync: openCloseStore } =
    api.store.openCloseStore.useMutation();
  const utils = api.useUtils();
  const { toast } = useToast();
  const [storeObject, setStoreObject] = useState<StoreObject>();

  const handleOpenOrderDialog = (storeToOpen: StoreObject) => {
    setStoreObject(storeToOpen);
  };

  const handleStoreOpenClose = (store: StoreObject) => {
    openCloseStore({ storeId: store.id, isOpen: !store.isOpen })
      .then(() => {
        return utils.store.invalidate();
      })
      .then(() => {
        toast({
          title: `${store.isOpen ? "Closing" : "Opening"} store`,
          description: `Store ${store.name} is now ${store.isOpen ? "closed" : "open"}!`,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to open store!",
          variant: "destructive",
        });
      });
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Stores</SidebarGroupLabel>
      <SidebarMenu>
        {stores.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton onClick={() => handleOpenOrderDialog(item)}>
              {item.isOpen ? <Circle /> : <CircleOff />}
              {item.name}
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onClick={() => handleOpenOrderDialog(item)}>
                  <SquareMenu className="text-muted-foreground" />
                  Order from Store
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>Manage Store</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStoreOpenClose(item)}>
                  {item.isOpen ? (
                    <CircleOff className="text-muted-foreground" />
                  ) : (
                    <Circle className="text-muted-foreground" />
                  )}
                  <span> {item.isOpen ? "Close Store" : "Open Store"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <TableSelectorDialog
        storeObject={storeObject}
        setStoreObject={setStoreObject}
        handleStoreOpenClose={handleStoreOpenClose}
      />
    </SidebarGroup>
  );
}

const formSchema = z.object({
  tableNumber: z.string().min(1),
});

function TableSelectorDialog({
  storeObject,
  setStoreObject,
  handleStoreOpenClose,
}: {
  storeObject?: StoreObject;
  setStoreObject: (newStoreObject?: StoreObject) => void;
  handleStoreOpenClose: (store: StoreObject) => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tableNumber: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (storeObject) {
      const url = `${storeObject.orderUrl}/${values.tableNumber}`;
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (newWindow) newWindow.opener = null;
    }
    handleOnOpenChange(false);
  };

  const onStoreOpenClose = (store: StoreObject) => {
    handleStoreOpenClose(store);
    handleOnOpenChange(false);
  };

  const handleOnOpenChange = (open: boolean) => {
    if (!open) {
      setStoreObject();
    }
  };

  return (
    <Dialog open={!!storeObject} onOpenChange={handleOnOpenChange}>
      {storeObject && (
        <DialogContent className="flex flex-col">
          <DialogTitle>{storeObject?.name}</DialogTitle>
          {storeObject.isOpen ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogDescription>
                  Select a table to make order
                </DialogDescription>
                <FormField
                  control={form.control}
                  name="tableNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-background"
                          type="tel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="w-full !flex-row-reverse !justify-between pt-4">
                  <div>
                    <Button type="submit">Order</Button>
                  </div>
                  <div>
                    <Button
                      onClick={() => onStoreOpenClose(storeObject)}
                      variant="ghost"
                    >
                      Close Store
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <>
              <DialogDescription>
                Store is now closed, open store to start ordering.
              </DialogDescription>
              <DialogFooter className="justify-between pt-4">
                <Button onClick={() => onStoreOpenClose(storeObject)}>
                  Open Store
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
