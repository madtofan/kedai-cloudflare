"use client";

import { useMenuContext } from "./_provider";
import { BrowsePage } from "./_browse-page";
import { CheckoutPage } from "./_checkout-page";
import OrderSuccessPage from "./_order-success-page";
import ClosedPage from "./_closed-page";
import NotFound from "./_not-found-page";

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
  if (content === "closed") {
    return <ClosedPage />;
  }
  if (content === "not found") {
    return <NotFound />;
  }
  return null;
}
