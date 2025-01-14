import { useEffect, useMemo, useState } from "react";
import { type MenuDetails, useMenuContext } from "./_provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { StickyBottom, StickyTop } from "~/components/ui/sticky";
import { VerticalContainer } from "~/components/ui/container";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function BrowsePage() {
  const { storeData, cart, updateCart, totalPrice, updateContent } =
    useMenuContext();

  const storeMenu = useMemo(() => {
    return storeData.storeMenus.reduce<Record<string, MenuDetails[]>>(
      (acc, val) => {
        const groupName = val.menu.menuGroups.name;
        const prevVal = acc[groupName] ?? [];
        return { ...acc, [groupName]: [...prevVal, val.menu.menuDetails] };
      },
      {},
    );
  }, [storeData.storeMenus]);

  const [currentCategory, setCurrentCategory] = useState<
    string | null | undefined
  >(Object.keys(storeMenu)[0]);

  useEffect(() => {
    const handleScroll = () => {
      setCurrentCategory(null);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  type MenuGroupEntries = [string, MenuDetails[]];

  const renderMenuGroup = (menuGroupEntries: MenuGroupEntries) => {
    const [menuGroupName, groupMenuItems] = menuGroupEntries;
    return (
      <div className="space-y-8" key={menuGroupName}>
        <section id={menuGroupName}>
          <h2 className="mb-4 text-2xl font-semibold">{menuGroupName}</h2>
          {groupMenuItems.map(renderMenuItem)}
        </section>
      </div>
    );
  };

  const renderMenuItem = (item: MenuDetails) => {
    const currentCount = cart[item.id] ?? 0;
    return (
      <Card key={item.id} className="mb-4" id={item.name}>
        <CardHeader>
          <CardTitle>{item.name}</CardTitle>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {item.image && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element*/}
              <img
                src={item.image}
                key={item.id}
                alt={`${item.name} preview`}
                className="mx-auto h-40 w-40 rounded-md object-cover shadow"
              />
            </>
          )}
          <p className="text-center text-2xl font-bold">
            ${item.sale.toFixed(2)}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => updateCart(item.id, currentCount - 1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-xl font-bold">{cart[item.id] ?? 0}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => updateCart(item.id, currentCount + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <>
      <StickyTop>
        <VerticalContainer className="p-0">
          <Select
            value={currentCategory ?? undefined}
            key={currentCategory}
            onValueChange={(value) => {
              const element = document.getElementById(value);
              element?.scrollIntoView({ block: "start", inline: "nearest" });
              setCurrentCategory(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.keys(storeMenu).map((menu) => (
                  <SelectItem value={menu} key={`${menu}_select`}>
                    {menu}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </VerticalContainer>
      </StickyTop>
      <VerticalContainer>
        <h1 className="mb-6 text-3xl font-bold">{storeData.name}</h1>
        {Object.entries(storeMenu).map(renderMenuGroup)}
      </VerticalContainer>
      <StickyBottom>
        <VerticalContainer className="p-0">
          <div className="mb-4 flex items-center justify-between text-xl font-bold">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <Button
            className="w-full"
            disabled={Object.keys(cart).length === 0}
            onClick={() => updateContent("checkout")}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> View Cart
          </Button>
        </VerticalContainer>
      </StickyBottom>
    </>
  );
}
