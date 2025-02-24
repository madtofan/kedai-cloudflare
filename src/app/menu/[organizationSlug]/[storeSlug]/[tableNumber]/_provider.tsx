"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { type RouterOutputs } from "~/server/api/root";
import { api } from "~/trpc/react";

export interface MenuDetails {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
  sale: number;
}

type ContentType = "browse" | "checkout" | "success" | "closed" | "not found";

interface MenuContext {
  storeData: RouterOutputs["store"]["getStoreMenus"];
  cart: Record<number, number>;
  updateCart: (menuId: number, menuCount: number) => void;
  totalPrice: number;
  content: ContentType;
  updateContent: (newContent: ContentType) => void;
  tableName: string;
  submitOrder: () => Promise<RouterOutputs["order"]["addOrder"]>;
  submittingOrder: boolean;
}

const Context = createContext<MenuContext>({
  storeData: {
    name: "",
    isOpen: true,
    storeMenus: [],
  },
  cart: {},
  updateCart: () => {
    console.log("Uninitialized context");
  },
  totalPrice: 0,
  content: "browse",
  updateContent: () => {
    console.log("Uninitialized context");
  },
  tableName: "",
  submitOrder: () => {
    return new Promise((resolve) =>
      resolve({
        success: false,
      }),
    );
  },
  submittingOrder: false,
});

export const useMenuContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw Error("useMenuContext must be used within MenuProvider");
  }
  return context;
};

export function MenuProvider({
  menu,
  table,
  organization,
  store,
  children,
}: {
  menu: RouterOutputs["store"]["getStoreMenus"];
  table: string;
  organization: string;
  store: string;
  children: ReactNode;
}) {
  const [storeData, _setStoreData] = useState(menu);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [tableName] = useState(table);
  const [organizationSlug] = useState(organization);
  const [storeSlug] = useState(store);
  const [content, setContent] = useState<ContentType>(
    menu.isOpen ? (menu.name ? "browse" : "not found") : "closed",
  );

  const { mutateAsync: orderItems, isPending: submittingOrder } =
    api.order.addOrder.useMutation({
      onSuccess: () => {
        setCart({});
        setTotalPrice(0);
      },
    });

  const storeItemMap: Record<number, MenuDetails> = useMemo(
    () =>
      storeData.storeMenus.reduce(
        (acc, storeMenu) => ({
          ...acc,
          [storeMenu.menu.menuDetails.id]: storeMenu.menu.menuDetails,
        }),
        {},
      ),
    [storeData.storeMenus],
  );

  const updateCart = useCallback(
    (menuId: number, menuCount: number) => {
      setCart((prevCart) => {
        const newCart = { ...prevCart };
        if (menuCount <= 0) {
          delete newCart[menuId];
        } else {
          newCart[menuId] = menuCount;
        }
        const newPrice = Object.entries(newCart).reduce(
          (total, [itemId, itemCount]) => {
            const menuDetail = storeItemMap[Number(itemId)];
            if (menuDetail) {
              return total + menuDetail.sale * itemCount;
            }
            return total;
          },
          0,
        );
        setTotalPrice(newPrice);
        return newCart;
      });
    },
    [storeItemMap],
  );

  const submitOrder = useCallback(() => {
    return orderItems({
      organizationSlug,
      storeSlug,
      tableName,
      orders: Object.entries(cart).map(([menuDetailsId, quantity]) => ({
        menuDetailsId: Number(menuDetailsId),
        quantity,
      })),
    });
  }, [cart, orderItems, organizationSlug, storeSlug, tableName]);

  const values = useMemo(
    () => ({
      storeData,
      cart,
      updateCart,
      totalPrice,
      content,
      tableName,
      updateContent: setContent,
      submitOrder,
      submittingOrder,
    }),
    [
      storeData,
      cart,
      updateCart,
      totalPrice,
      content,
      tableName,
      submitOrder,
      submittingOrder,
    ],
  );

  return <Context.Provider value={values}>{children}</Context.Provider>;
}
