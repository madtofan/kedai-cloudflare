"use client";

import { useMenuContext } from "./_provider";
import { BrowsePage } from "./_browse-page";
import { CheckoutPage } from "./_checkout-page";
import OrderSuccessPage from "./_order-success-page";

export default function MenuPage() {
  const { content } = useMenuContext();

  if (content === "browse") {
    return <BrowsePage />;
  }
  if (content === "checkout") {
    return <CheckoutPage />;
  }
  if (content === "success") {
    return <OrderSuccessPage />;
  }
  return null;
}
