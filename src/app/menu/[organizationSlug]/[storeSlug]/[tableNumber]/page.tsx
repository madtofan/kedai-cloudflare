"use client";

import { useMenuContext } from "./_provider";
import { BrowsePage } from "./_browse-page";
import { CheckoutPage } from "./_checkout-page";

export default function MenuPage() {
  const { content } = useMenuContext();

  if (content === "browse") {
    return <BrowsePage />;
  }
  if (content === "checkout") {
    return <CheckoutPage />;
  }
  return null;
}
