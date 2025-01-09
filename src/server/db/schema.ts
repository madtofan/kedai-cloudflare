import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTableCreator,
  sqliteTable,
  text,
  unique,
  real,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

const generatePublicId = () => nanoid();

// Auth tables
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});
export const userRelations = relations(user, ({ many }) => ({
  invites: many(invitation),
  members: many(member),
  sessions: many(session),
  accounts: many(account),
}));

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  activeOrganizationId: text("activeOrganizationId"),
});
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});

export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  metadata: text("metadata"),
});
export const organizationRelations = relations(organization, ({ many }) => ({
  invitations: many(invitation),
  permissionGroups: many(permissionGroups),
  stores: many(stores),
  menuGroups: many(menuGroups),
  members: many(member),
}));

export const member = sqliteTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  role: text("role").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});
export const memberRelations = relations(member, ({ one, many }) => ({
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  roles: many(memberToPermissionGroups),
}));

export const invitation = sqliteTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  inviterId: text("inviterId")
    .notNull()
    .references(() => user.id),
});
export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

// Custom table creations
export const createTable = sqliteTableCreator((name) => name);

// Tables and Relations
export const memberToPermissionGroups = createTable("memberToPermsGroups", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  memberId: text("memberId")
    .references(() => member.id, {
      onDelete: "cascade",
    })
    .notNull(),
  permissionGroupId: integer("permsGroupId")
    .references(() => permissionGroups.id, {
      onDelete: "cascade",
    })
    .notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
    () => new Date(),
  ),
});
export const memberToPermissionGroupsRelations = relations(
  memberToPermissionGroups,
  ({ one }) => ({
    member: one(member, {
      fields: [memberToPermissionGroups.memberId],
      references: [member.id],
    }),
    permissionGroup: one(permissionGroups, {
      fields: [memberToPermissionGroups.permissionGroupId],
      references: [permissionGroups.id],
    }),
  }),
);

export const permissionGroups = createTable(
  "permissionGroups",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    isAdmin: integer("isAdmin", { mode: "boolean" }).default(false),
    isDefault: integer("isDefault", { mode: "boolean" }).default(false),
    identifier: text("identifier"),
    organizationId: text("organizationId")
      .references(() => organization.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    organizationIndex: index("roleOrganizationIdx").on(example.organizationId),
  }),
);
export const permissionGroupsRelations = relations(
  permissionGroups,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [permissionGroups.organizationId],
      references: [organization.id],
    }),
    member: many(memberToPermissionGroups),
    permissions: many(groupsToPermissions),
  }),
);

export const permissions = createTable("permissions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
  displayName: text("name").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
    () => new Date(),
  ),
});
export const permissionsRelations = relations(permissions, ({ many }) => ({
  permissionGroups: many(groupsToPermissions),
}));

export const groupsToPermissions = createTable("rolesToPerms", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  permissionGroupId: integer("orgRoleId")
    .references(() => permissionGroups.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  permissionId: integer("permsId")
    .references(() => permissions.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
    () => new Date(),
  ),
});
export const rolesToPermissionsRelations = relations(
  groupsToPermissions,
  ({ one }) => ({
    permissionGroup: one(permissionGroups, {
      fields: [groupsToPermissions.permissionGroupId],
      references: [permissionGroups.id],
    }),
    permission: one(permissions, {
      fields: [groupsToPermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const stores = createTable(
  "stores",
  {
    id: text("id").$default(generatePublicId).primaryKey(),
    name: text("name").notNull(),
    isOpen: integer("isOpen", { mode: "boolean" }).default(false),
    slug: text("slug").notNull(),
    organizationId: text("organizationId")
      .references(() => organization.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    organizationIndex: index("storeOrganizationIdx").on(example.organizationId),
    slugIndex: unique().on(example.organizationId, example.slug),
  }),
);
export const storesRelations = relations(stores, ({ one, many }) => ({
  organization: one(organization, {
    fields: [stores.organizationId],
    references: [organization.id],
  }),
  orders: many(orders),
  storeMenus: many(storeMenus),
}));

export const menuGroups = createTable(
  "menuGroups",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    organizationId: text("organizationId")
      .references(() => organization.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    organizationIndex: index("menuGroupOrganizationIdx").on(
      example.organizationId,
    ),
  }),
);
export const menuGroupsRelations = relations(menuGroups, ({ one, many }) => ({
  organization: one(organization, {
    fields: [menuGroups.organizationId],
    references: [organization.id],
  }),
  menus: many(menus),
}));

export const menuDetails = createTable(
  "menuDetails",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    image: text("image"),
    sale: real("sale").notNull(),
    cost: real("cost").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    nameIndex: index("menuNameIndex").on(example.name),
  }),
);
export const menuDetailsRelations = relations(menuDetails, ({ many }) => ({
  menuToMenuDetails: many(menuToMenuDetails),
}));

export const storeMenus = createTable(
  "storeMenus",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    storeId: text("storeId")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    menuId: integer("menuId")
      .references(() => menus.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    storeIndex: index("menuStoreIdx").on(example.storeId),
  }),
);
export const storeMenusRelations = relations(storeMenus, ({ one }) => ({
  store: one(stores, {
    fields: [storeMenus.storeId],
    references: [stores.id],
  }),
  menu: one(menus, {
    fields: [storeMenus.menuId],
    references: [menus.id],
  }),
}));

export const menus = createTable(
  "menus",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    menuGroupId: integer("menuGroupId")
      .references(() => menuGroups.id, {
        onDelete: "set null",
      })
      .notNull(),
    menuDetailsId: integer("menuDetailsId")
      .references(() => menuDetails.id, {
        onDelete: "set null",
      })
      .notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    menuGroupIndex: index("menuGroupIdx").on(example.menuGroupId),
  }),
);
export const menusRelations = relations(menus, ({ one, many }) => ({
  menuGroups: one(menuGroups, {
    fields: [menus.menuGroupId],
    references: [menuGroups.id],
  }),
  menuDetails: one(menuDetails, {
    fields: [menus.menuDetailsId],
    references: [menuDetails.id],
  }),
  menuToMenuDetails: many(menuToMenuDetails),
}));

export const menuToMenuDetails = createTable("menuToMenuDetails", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  menuId: integer("menuId")
    .references(() => menus.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  menuDetailId: integer("menuDetailId")
    .references(() => menuDetails.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
    () => new Date(),
  ),
});

export const menuToMenuDetailsRelations = relations(
  menuToMenuDetails,
  ({ one }) => ({
    menuDetails: one(menuDetails, {
      fields: [menuToMenuDetails.menuDetailId],
      references: [menuDetails.id],
    }),
    menu: one(menus, {
      fields: [menuToMenuDetails.menuId],
      references: [menus.id],
    }),
  }),
);

export const orders = createTable(
  "orders",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    storeId: text("storeId")
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    tableName: text("tableName").notNull(),
    completedAt: integer("completedAt", { mode: "timestamp" }),
    completedValue: real("completedValue"),
    remarks: text("remarks"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    storeIndex: index("orderStoreIdx").on(example.storeId),
  }),
);
export const ordersRelations = relations(orders, ({ one, many }) => ({
  stores: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItems = createTable(
  "orderItems",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    orderId: integer("orderId")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    menuDetailsId: integer("menuDetailsId").notNull(),
    quantity: integer("quantity").notNull(),
    status: text("status").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    orderIndex: index("itemOrderIdx").on(example.orderId),
  }),
);
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuDetails: one(menuDetails, {
    fields: [orderItems.menuDetailsId],
    references: [menuDetails.id],
  }),
}));
