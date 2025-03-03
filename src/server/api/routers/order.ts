import { z } from "zod";
import {
  createTRPCRouter,
  organizationProcedure,
  publicProcedure,
} from "../trpc";
import { orderItems, orders } from "../../db/schema";
import { eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const orderRouter = createTRPCRouter({
  addOrder: publicProcedure
    .input(
      z.object({
        organizationSlug: z.string().trim().min(1).max(256),
        storeSlug: z.string().trim().min(1).max(256),
        tableName: z.string().trim().min(1).max(256),
        orders: z.array(
          z.object({
            menuDetailsId: z.number().int(),
            quantity: z.number().int(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.query.organization.findFirst({
        where: (organization, { eq }) =>
          eq(organization.slug, input.organizationSlug),
        columns: {
          id: true,
        },
        with: {
          stores: {
            where: (store, { eq }) => eq(store.slug, input.storeSlug),
            columns: { id: true },
          },
        },
      });
      const storeId = organization?.stores.find(Boolean)?.id;
      if (!storeId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Store not found.",
        });
      }
      const order = (
        await ctx.db
          .insert(orders)
          .values({
            storeId,
            tableName: input.tableName,
          })
          .returning()
      ).find(Boolean);
      // }
      if (!order) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order.",
        });
      }
      const itemValues = input.orders.map(({ menuDetailsId, quantity }) => ({
        menuDetailsId,
        quantity,
        orderId: order.id,
        status: "new",
      }));
      const items = await ctx.db
        .insert(orderItems)
        .values(itemValues)
        .returning();
      if (items.length !== input.orders.length) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create some item orders.",
        });
      }
      return { success: true };
    }),

  updateOrder: organizationProcedure
    .input(
      z.object({
        id: z.number().int(),
        itemStatuses: z.string().trim().min(1).max(256),
        completedValue: z.number().optional(),
        remarks: z.string().trim().max(256).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        columns: {
          tableName: true,
        },
        where: (order, { eq }) => eq(order.id, input.id),
        with: {
          stores: {
            columns: {
              organizationId: true,
            },
          },
          orderItems: {
            columns: {
              id: true,
            },
          },
        },
      });
      if (order?.stores.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Organization does not belong to user.",
        });
      }

      if (input.completedValue || input.remarks) {
        let setValues = {};
        if (input.completedValue)
          setValues = { ...setValues, completedValue: input.completedValue };
        if (input.remarks) setValues = { ...setValues, remarks: input.remarks };
        const updatedOrder = (
          await ctx.db
            .update(orders)
            .set(setValues)
            .where(eq(orders.id, input.id))
            .returning()
        )?.find(Boolean);
        if (updatedOrder) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update order",
          });
        }
      }
      const itemIds = order.orderItems.map((item) => item.id);
      const updatedItems = await ctx.db
        .update(orderItems)
        .set({
          status: input.itemStatuses,
        })
        .where(inArray(orderItems, itemIds))
        .returning();
      if (updatedItems.length !== itemIds.length) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update all order items",
        });
      }

      return { success: true };
    }),

  updateOrderItem: organizationProcedure
    .input(
      z.object({
        id: z.number().int(),
        quantity: z.number().optional(),
        status: z.string().trim().max(256).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orderItem = await ctx.db.query.orderItems.findFirst({
        where: (item, { eq }) => eq(item.id, input.id),
        with: {
          order: {
            columns: {
              id: true,
            },
            with: {
              stores: {
                columns: {
                  organizationId: true,
                },
              },
            },
          },
        },
      });
      if (orderItem?.order.stores.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Organization does not belong to user.",
        });
      }
      let setValue = {};
      if (input.quantity) setValue = { ...setValue, quantity: input.quantity };
      if (input.status) setValue = { ...setValue, quantity: input.status };
      const updatedItem = await ctx.db
        .update(orderItems)
        .set(setValue)
        .where(eq(orderItems.id, input.id))
        .returning();
      if (!updatedItem) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order item.",
        });
      }
      return { success: true };
    }),

  getTableOrders: publicProcedure
    .input(
      z.object({
        organizationSlug: z.string().trim().min(1).max(256),
        storeSlug: z.string().trim().min(1).max(256),
        tableName: z.string().trim().min(1).max(256),
      }),
    )
    .query(async ({ ctx, input }) => {
      const orders =
        (
          await ctx.db.query.organization.findFirst({
            where: (organization, { eq }) =>
              eq(organization.slug, input.organizationSlug),
            columns: {
              id: true,
            },
            with: {
              stores: {
                where: (store, { eq }) => eq(store.slug, input.storeSlug),
                columns: { id: true },
                with: {
                  orders: {
                    where: (order, { eq, and, isNull }) =>
                      and(
                        eq(order.tableName, input.tableName),
                        isNull(order.completedAt),
                      ),
                    columns: { id: true, createdAt: true },
                    with: {
                      orderItems: {
                        columns: {
                          status: true,
                          quantity: true,
                        },
                        with: {
                          menuDetails: {
                            columns: {
                              name: true,
                              sale: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        )?.stores.find(Boolean)?.orders ?? [];

      return orders;
    }),
});

export default orderRouter;
