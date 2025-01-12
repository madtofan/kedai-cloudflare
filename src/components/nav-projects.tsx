"use client";

import {
  Circle,
  CircleOff,
  Folder,
  MoreHorizontal,
  Share,
  SquareMenu,
} from "lucide-react";
import Link from "next/link";

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

export function NavStores({
  stores,
}: {
  stores: {
    id: string;
    name: string;
    url: string;
    orderUrl: string;
    isOpen: boolean | null;
  }[];
}) {
  const { isMobile } = useSidebar();
  const { mutateAsync: openCloseStore } =
    api.store.openCloseStore.useMutation();
  const utils = api.useUtils();
  const { toast } = useToast();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Stores</SidebarGroupLabel>
      <SidebarMenu>
        {stores.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                {item.isOpen ? <Circle /> : <CircleOff />}
                <span>{item.name}</span>
              </a>
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
                <DropdownMenuItem asChild>
                  <a
                    href={item.orderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SquareMenu className="text-muted-foreground" />
                    <span>Store Menu</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>Manage Store</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    openCloseStore({ storeId: item.id, isOpen: !item.isOpen })
                      .then(() => {
                        return utils.store.invalidate();
                      })
                      .then(() => {
                        toast({
                          title: `${item.isOpen ? "Closing" : "Opening"} store`,
                          description: `Store ${item.name} is now ${item.isOpen ? "closed" : "open"}!`,
                        });
                      })
                      .catch(() => {
                        toast({
                          title: "Error",
                          description: "Failed to open store!",
                          variant: "destructive",
                        });
                      });
                  }}
                >
                  {item.isOpen ? (
                    <CircleOff className="text-muted-foreground" />
                  ) : (
                    <Circle className="text-muted-foreground" />
                  )}
                  <span>{item.isOpen ? "Close Store" : "Open Store"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
