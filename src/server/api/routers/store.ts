import { z } from "zod";
import {
  createTRPCRouter,
  organizationProcedure,
  publicProcedure,
} from "../trpc";
import { stores } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import slug from "slug";

const storeRouter = createTRPCRouter({
  addStore: organizationProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(256),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const storeSlug = slug(input.name);
      let append = "";
      const storeWithSimilarSlug = await ctx.db.query.stores.findMany({
        where: (store, { and, eq, like }) =>
          and(
            like(store.slug, `${storeSlug}%`),
            eq(store.organizationId, ctx.organizationId),
          ),
      });
      if (storeWithSimilarSlug.length > 0) {
        append = `-${Math.max(
          ...storeWithSimilarSlug.map((store) => {
            const slugNumber = Number(store.slug.split("-").at(-1));
            if (isNaN(slugNumber)) {
              return 2;
            }
            return slugNumber + 1;
          }),
        )}`;
      }
      const store = (
        await ctx.db
          .insert(stores)
          .values({
            name: input.name,
            slug: `${storeSlug}${append}`,
            organizationId: ctx.organizationId,
          })
          .returning()
      ).find(Boolean);
      if (!store) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create store.",
        });
      }
      return store;
    }),

  editStore: organizationProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1).max(256),
        slug: z.string().trim().min(1).max(256),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedStore = await ctx.db
        .update(stores)
        .set({
          name: input.name,
          slug: input.slug,
        })
        .where(
          and(
            eq(stores.organizationId, ctx.organizationId),
            eq(stores.id, input.id),
          ),
        )
        .returning();
      if (!updatedStore) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update store.",
        });
      }
      return updatedStore;
    }),

  deleteStore: organizationProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deletedStore = await ctx.db
        .delete(stores)
        .where(
          and(
            eq(stores.organizationId, ctx.organizationId),
            eq(stores.id, input.id),
          ),
        )
        .returning();
      if (!deletedStore) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete store.",
        });
      }
      return { success: true };
    }),

  openCloseStore: organizationProcedure
    .input(
      z.object({
        storeId: z.string(),
        isOpen: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedStore = await ctx.db
        .update(stores)
        .set({
          isOpen: input.isOpen,
        })
        .where(
          and(
            eq(stores.organizationId, ctx.organizationId),
            eq(stores.id, input.storeId),
          ),
        )
        .returning();
      if (!updatedStore) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to update the store.",
        });
      }
      return { success: true };
    }),

  getAllStore: organizationProcedure.query(async ({ ctx }) => {
    const stores = await ctx.db.query.stores.findMany({
      columns: { organizationId: false },
      where: (store, { eq }) => eq(store.organizationId, ctx.organizationId),
    });
    return stores;
  }),

  getAllStoreWithMenu: organizationProcedure.query(async ({ ctx }) => {
    const stores = await ctx.db.query.stores.findMany({
      columns: { organizationId: false },
      where: (store, { eq }) => eq(store.organizationId, ctx.organizationId),
      with: {
        storeMenus: {
          columns: {
            id: false,
            storeId: false,
            menuId: false,
            createdAt: false,
            updatedAt: false,
          },
          with: {
            menu: {
              columns: {
                id: false,
                menuGroupId: false,
                menuDetailsId: false,
                createdAt: false,
                updatedAt: false,
              },
              with: {
                menuDetails: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return stores;
  }),

  getStoreMenus: publicProcedure
    .input(
      z.object({
        storeSlug: z.string().trim().min(1).max(256),
        organizationSlug: z.string().trim().min(1).max(256),
      }),
    )
    .query(async ({ ctx, input }) => {
      const organization = await ctx.db.query.organization.findFirst({
        columns: { id: true },
        where: (organization, { eq }) =>
          eq(organization.slug, input.organizationSlug),
      });
      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Unable to find organization.",
        });
      }
      const store = await ctx.db.query.stores.findFirst({
        columns: { isOpen: true },
        where: (store, { eq, and }) =>
          and(
            eq(store.slug, input.storeSlug),
            eq(store.organizationId, organization.id),
          ),
      });
      if (!store?.isOpen) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Store does not exist or is currently closed",
        });
      }
      const storeMenus = await ctx.db.query.stores.findFirst({
        columns: { name: true },
        where: (store, { and, eq }) =>
          and(
            eq(store.slug, input.storeSlug),
            eq(store.organizationId, organization.id),
          ),
        with: {
          storeMenus: {
            columns: {
              id: true,
            },
            with: {
              menu: {
                columns: {
                  id: true,
                },
                with: {
                  menuDetails: {
                    columns: {
                      createdAt: false,
                      updatedAt: false,
                      cost: false,
                    },
                  },
                  menuGroups: {
                    columns: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!storeMenus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Unable to find store.",
        });
      }
      return storeMenus;
    }),
});

export default storeRouter;
