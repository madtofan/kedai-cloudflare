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

export interface MenuDetails {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
  sale: number;
}

type ContentType = "browse" | "checkout";

interface MenuContext {
  storeData: RouterOutputs["store"]["getStoreMenus"];
  cart: Record<number, number>;
  updateCart: (menuId: number, menuCount: number) => void;
  totalPrice: number;
  content: ContentType;
  updateContent: (newContent: ContentType) => void;
  tableNumber: string;
}

const Context = createContext<MenuContext>({
  storeData: {
    name: "",
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
  tableNumber: "",
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
  children,
}: {
  menu: RouterOutputs["store"]["getStoreMenus"];
  table: string;
  children: ReactNode;
}) {
  const [storeData, _setStoreData] = useState(menu);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [tableNumber] = useState(table);
  const [content, setContent] = useState<ContentType>("browse");

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

  const values = useMemo(
    () => ({
      storeData,
      cart,
      updateCart,
      totalPrice,
      content,
      tableNumber,
      updateContent: setContent,
    }),
    [storeData, cart, updateCart, totalPrice, content, tableNumber],
  );

  return <Context.Provider value={values}>{children}</Context.Provider>;
}
