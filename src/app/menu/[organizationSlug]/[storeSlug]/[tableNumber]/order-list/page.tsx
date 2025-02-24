import { ArrowLeft, Clock } from "lucide-react";
import { type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/server";
import { type ParamType } from "../layout";
import { Badge } from "~/components/ui/badge";
import { type RouterOutputs } from "~/server/api/root";
import { Separator } from "~/components/ui/separator";
import { StickyTop } from "~/components/ui/sticky";
import { VerticalContainer } from "~/components/ui/container";
import { Button } from "~/components/ui/button";
import Link from "next/link";

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

function getStatusColor(status: string) {
  switch (status) {
    case "preparing":
      return "bg-yellow-500";
    case "served":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
}

const TAX_RATE = 0.1; // 10% tax rate

function calculateOrderTotals(
  items: RouterOutputs["order"]["getTableOrders"][0]["orderItems"],
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.menuDetails.sale * item.quantity,
    0,
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export default async function OrderHistoryPage({
  params,
}: {
  params: ParamType;
  children: ReactNode;
}) {
  const { organizationSlug, storeSlug, tableNumber } = await params;

  const tableOrders = await api.order.getTableOrders({
    organizationSlug,
    storeSlug,
    tableName: tableNumber,
  });
  const totalBill = tableOrders.reduce((sum, order) => {
    const { total } = calculateOrderTotals(order.orderItems);
    return sum + total;
  }, 0);

  return (
    <div>
      <StickyTop>
        <VerticalContainer className="p-0">
          <Button className="w-full" asChild>
            <Link
              href={`/menu/${organizationSlug}/${storeSlug}/${tableNumber}`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to browse
            </Link>
          </Button>
        </VerticalContainer>
      </StickyTop>
      <div className="min-h-screen bg-muted/40 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{`Table ${tableNumber} orders`}</CardTitle>
              <div className="flex items-center gap-2">
                {tableOrders[0] && (
                  <>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {`Session started at ${formatDateTime(tableOrders[0].createdAt)}`}
                    </span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 text-2xl font-bold">
                Total Bill: ${totalBill.toFixed(2)}
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {tableOrders.map((order) => {
                  const { subtotal, tax, total } = calculateOrderTotals(
                    order.orderItems,
                  );

                  return (
                    <AccordionItem
                      key={order.id}
                      value={`${order.id}`}
                      className="rounded-lg border px-6"
                    >
                      <AccordionTrigger className="gap-4">
                        <div className="flex flex-1 items-center justify-between pr-4">
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">{order.id}</span>
                            <Badge variant="secondary">
                              {formatDateTime(order.createdAt)}
                            </Badge>
                          </div>
                          <div className="font-semibold">
                            ${total.toFixed(2)}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">
                                Price
                              </TableHead>
                              <TableHead className="text-right">
                                Total
                              </TableHead>
                              <TableHead className="text-right">
                                Status
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.orderItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.menuDetails.name}</TableCell>
                                <TableCell className="text-right">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${item.menuDetails.sale.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  $
                                  {(
                                    item.quantity * item.menuDetails.sale
                                  ).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    className={getStatusColor(item.status)}
                                  >
                                    {item.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={5}>
                                <Separator className="my-2" />
                                <div className="space-y-1 text-right">
                                  <div className="text-sm text-muted-foreground">
                                    Subtotal: ${subtotal.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {`Tax (${TAX_RATE * 100}%): ${tax.toFixed(2)}`}
                                  </div>
                                  <div className="font-medium">
                                    Order Total: ${total.toFixed(2)}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
