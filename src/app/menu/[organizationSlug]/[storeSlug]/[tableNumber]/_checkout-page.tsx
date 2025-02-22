"use client";

import type React from "react";

import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useMenuContext } from "./_provider";
import { StickyTop } from "~/components/ui/sticky";
import { VerticalContainer } from "~/components/ui/container";

export function CheckoutPage() {
  const {
    storeData,
    cart,
    updateCart,
    totalPrice,
    updateContent,
    submitOrder,
    submittingOrder,
  } = useMenuContext();

  const tax = totalPrice * 0.1; // 10% tax
  const total = totalPrice + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitOrder) {
      submitOrder()
        .then(() => {
          updateContent("success");
        })
        .catch((err) => console.error(err));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <StickyTop>
        <VerticalContainer className="p-0">
          <Button className="w-full" onClick={() => updateContent("browse")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to browse
          </Button>
        </VerticalContainer>
      </StickyTop>

      <VerticalContainer className="grid gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(cart).map(([itemId, count]) => {
              const itemMenu = storeData.storeMenus.find(
                (storeMenu) => storeMenu.menu.menuDetails.id === Number(itemId),
              )?.menu.menuDetails;
              if (!itemMenu) {
                return null;
              }
              return (
                <div key={itemId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{itemMenu?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${itemMenu.sale.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCart(itemMenu.id, count - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{count}</span>
                    <Button
                      variant="outline"
                      type="button"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCart(itemMenu.id, count + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="ml-4 w-20 text-right">
                    ${(itemMenu.sale * count).toFixed(2)}
                  </div>
                </div>
              );
            })}

            {Object.keys(cart).length === 0 && (
              <p className="text-center text-muted-foreground">
                Your cart is empty
              </p>
            )}

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup defaultValue="cashier">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cashier" id="cashier" />
                  <Label htmlFor="cashier">Pay at Cashier</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={submittingOrder || Object.keys(cart).length === 0}
            >
              {submittingOrder ? (
                <Spinner />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              Place Order
            </Button>
          </CardFooter>
        </Card>
      </VerticalContainer>
    </form>
  );
}
