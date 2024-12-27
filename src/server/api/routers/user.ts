import {
  createTRPCRouter,
  organizationProcedure,
  protectedProcedure,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { memberToPermissionGroups } from "../../db/schema";
import { auth } from "~/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

const userRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    return {
      ...ctx.user,
      activeOrganizationId: ctx.session.activeOrganizationId,
    };
  }),

  inviteUser: organizationProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await auth(getRequestContext().env as Env).api.createInvitation({
        headers: ctx.headers,
        body: {
          email: input.email,
          role: "admin",
          organizationId: ctx.organizationId,
        },
      });
      return { success: true };
    }),

  removeUser: organizationProcedure
    .input(
      z.object({
        userId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await auth(getRequestContext().env as Env).api.removeMember({
        headers: ctx.headers,
        body: {
          memberIdOrEmail: input.userId,
          organizationId: ctx.organizationId,
        },
      });
      return { success: true };
    }),

  getAllInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invites = await ctx.db.query.invitation.findMany({
      columns: {
        organizationId: false,
        inviterId: false,
      },
      where: (invitation, { eq, and }) =>
        and(
          eq(invitation.email, ctx.user.email),
          eq(invitation.status, "pending"),
        ),
      with: {
        organization: {
          columns: {
            name: true,
          },
        },
        inviter: {
          columns: {
            name: true,
          },
        },
      },
    });
    return invites;
  }),

  acceptInvitation: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const acceptedInvitation = await auth(
        getRequestContext().env as Env,
      ).api.acceptInvitation({
        headers: ctx.headers,
        body: {
          invitationId: input.invitationId,
        },
      });

      if (!acceptedInvitation) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to accept invitation.",
        });
      }
      const defaultPermissionGroups =
        await ctx.db.query.permissionGroups.findMany({
          where: (permissionGroup, { eq, and }) =>
            and(
              eq(permissionGroup.isDefault, true),
              eq(
                permissionGroup.organizationId,
                acceptedInvitation.member.organizationId,
              ),
            ),
          columns: {
            id: true,
          },
        });
      const valuesToInsert = defaultPermissionGroups.map(
        (defaultPermission) => ({
          memberId: acceptedInvitation.member.id!,
          permissionGroupId: defaultPermission.id,
        }),
      );
      ctx.db.insert(memberToPermissionGroups).values(valuesToInsert);
      return { success: true };
    }),

  declineInvitation: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await auth(getRequestContext().env as Env).api.rejectInvitation({
        headers: ctx.headers,
        body: {
          invitationId: input.invitationId,
        },
      });
      return { success: true };
    }),

  leaveOrganization: organizationProcedure.mutation(async ({ ctx }) => {
    const removedUser = await auth(
      getRequestContext().env as Env,
    ).api.removeMember({
      headers: ctx.headers,
      body: {
        memberIdOrEmail: ctx.user.id,
      },
    });

    if (!removedUser) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove organization from user.",
      });
    }
    return { success: true };
  }),
});

export default userRouter;
