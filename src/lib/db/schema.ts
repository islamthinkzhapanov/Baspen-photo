import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  integer,
  jsonb,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Enums ---
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "user",
]);

export const eventMemberRoleEnum = pgEnum("event_member_role", [
  "owner",
  "photographer",
]);

export const pricingModeEnum = pgEnum("pricing_mode", [
  "exclusive",
  "commission",
]);

export const photoStatusEnum = pgEnum("photo_status", [
  "uploading",
  "processing",
  "ready",
  "failed",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "expired",
  "refunded",
]);

export const orderItemTypeEnum = pgEnum("order_item_type", [
  "single",
  "package",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "kaspi",
  "stripe",
  "manual",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

export const inviteStatusEnum = pgEnum("invite_status", ["active", "invited"]);

// --- Users ---
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  status: inviteStatusEnum("status").notNull().default("active"),
  phone: text("phone"),
  occupation: text("occupation"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [uniqueIndex("verification_token_idx").on(t.identifier, t.token)]
);

// --- Invite Tokens ---
export const inviteTokens = pgTable(
  "invite_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    usedAt: timestamp("used_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("invite_tokens_token_idx").on(t.token),
    index("invite_tokens_user_idx").on(t.userId),
  ]
);

// --- Password Reset Tokens ---
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    usedAt: timestamp("used_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("password_reset_tokens_token_idx").on(t.token),
    index("password_reset_tokens_user_idx").on(t.userId),
  ]
);

// --- Subscription Plans ---
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  maxEvents: integer("max_events").notNull().default(3),
  maxPhotosPerEvent: integer("max_photos_per_event").notNull().default(500),
  maxStorageGb: integer("max_storage_gb").notNull().default(5),
  priceMonthly: integer("price_monthly").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// --- Events ---
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    date: timestamp("date", { mode: "date" }),
    location: text("location"),
    coverUrl: text("cover_url"),
    pricingMode: pricingModeEnum("pricing_mode")
      .notNull()
      .default("commission"),
    branding: jsonb("branding").$type<{
      logo?: string;
      primaryColor?: string;
      bannerUrl?: string;
    }>(),
    settings: jsonb("settings").$type<{
      freeDownload?: boolean;
      watermarkEnabled?: boolean;
      watermarkText?: string;
      watermarkOpacity?: number;
      pricePerPhoto?: number;
      packageDiscount?: number;
      commissionPercent?: number;
      bibSearchEnabled?: boolean;
      faceSearchEnabled?: boolean;
      displayMode?: "search" | "gallery";
      retentionMonths?: number;
    }>(),
    geofence: jsonb("geofence").$type<{
      lat: number;
      lng: number;
      radiusKm: number;
    }>(),
    isPublished: boolean("is_published").notNull().default(false),
    photoCount: integer("photo_count").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("events_owner_idx").on(t.ownerId),
    index("events_slug_idx").on(t.slug),
  ]
);

// --- Event Members ---
export const eventMembers = pgTable(
  "event_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: eventMemberRoleEnum("role").notNull().default("photographer"),
    invitedAt: timestamp("invited_at", { mode: "date" }).defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date" }),
  },
  (t) => [
    uniqueIndex("event_member_unique").on(t.eventId, t.userId),
    index("event_members_event_idx").on(t.eventId),
  ]
);

// --- Albums ---
export const albums = pgTable(
  "albums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("albums_event_idx").on(t.eventId)]
);

// --- Photos ---
export const photos = pgTable(
  "photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    albumId: uuid("album_id").references(() => albums.id, {
      onDelete: "set null",
    }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    storagePath: text("storage_path").notNull(),
    thumbnailPath: text("thumbnail_path"),
    thumbnailAvifPath: text("thumbnail_avif_path"),
    watermarkedPath: text("watermarked_path"),
    placeholder: text("placeholder"), // tiny base64 blurred JPEG for blur-up effect
    originalFilename: text("original_filename"),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    width: integer("width"),
    height: integer("height"),
    exifData: jsonb("exif_data"),
    status: photoStatusEnum("status").notNull().default("uploading"),
    bibNumbers: text("bib_numbers").array(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("photos_event_idx").on(t.eventId),
    index("photos_album_idx").on(t.albumId),
    index("photos_status_idx").on(t.status),
  ]
);

// --- Face Embeddings (AWS Rekognition) ---
export const faceEmbeddings = pgTable(
  "face_embeddings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    rekognitionFaceId: text("rekognition_face_id"),
    bbox: jsonb("bbox").$type<{
      x: number;
      y: number;
      w: number;
      h: number;
    }>(),
    confidence: real("confidence"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("face_embeddings_event_idx").on(t.eventId)]
);

// --- Participants (anonymous search sessions) ---
export const participants = pgTable(
  "participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    rekognitionFaceId: text("rekognition_face_id"),
    bibNumber: text("bib_number"),
    phone: text("phone"),
    email: text("email"),
    sessionToken: text("session_token").notNull().unique(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    lastSearchAt: timestamp("last_search_at", { mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("participants_event_idx").on(t.eventId),
    index("participants_session_idx").on(t.sessionToken),
  ]
);

// --- Participant Matches (cached search results) ---
export const participantMatches = pgTable(
  "participant_matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    similarity: real("similarity").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("participant_match_unique").on(t.participantId, t.photoId),
    index("participant_matches_participant_idx").on(t.participantId),
  ]
);

// --- Sponsor Blocks ---
export const sponsorBlocks = pgTable(
  "sponsor_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    logoUrl: text("logo_url").notNull(),
    linkUrl: text("link_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("sponsor_blocks_event_idx").on(t.eventId)]
);

// --- Share Frames ---
export const shareFrames = pgTable(
  "share_frames",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    templateConfig: jsonb("template_config").$type<{
      showEventLogo?: boolean;
      showEventTitle?: boolean;
      showDate?: boolean;
      showSponsors?: boolean;
      backgroundColor?: string;
      borderWidth?: number;
      borderColor?: string;
    }>(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("share_frames_event_idx").on(t.eventId)]
);

// --- Orders ---
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id").references(() => participants.id, {
      onDelete: "set null",
    }),
    email: text("email"),
    phone: text("phone"),
    status: orderStatusEnum("status").notNull().default("pending"),
    totalAmount: integer("total_amount").notNull(),
    currency: text("currency").notNull().default("KZT"),
    downloadToken: text("download_token").notNull().unique(),
    downloadExpiresAt: timestamp("download_expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("orders_event_idx").on(t.eventId),
    index("orders_participant_idx").on(t.participantId),
    index("orders_download_token_idx").on(t.downloadToken),
    index("orders_status_idx").on(t.status),
  ]
);

// --- Order Items ---
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    photoId: uuid("photo_id").references(() => photos.id, {
      onDelete: "set null",
    }),
    type: orderItemTypeEnum("type").notNull().default("single"),
    price: integer("price").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_photo_idx").on(t.photoId),
  ]
);

// --- Payment Transactions ---
export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: paymentMethodEnum("provider").notNull(),
    externalId: text("external_id"),
    status: transactionStatusEnum("status").notNull().default("pending"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("KZT"),
    providerData: jsonb("provider_data"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("payment_tx_order_idx").on(t.orderId),
    index("payment_tx_external_idx").on(t.externalId),
  ]
);

// --- User Subscriptions ---
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "expired",
  "cancelled",
]);

export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlans.id),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    currentPeriodStart: timestamp("current_period_start", { mode: "date" })
      .defaultNow()
      .notNull(),
    currentPeriodEnd: timestamp("current_period_end", { mode: "date" })
      .notNull(),
    cancelledAt: timestamp("cancelled_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("user_subscriptions_user_idx").on(t.userId),
    index("user_subscriptions_plan_idx").on(t.planId),
  ]
);

// --- Audit Log ---
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "login",
  "role_change",
  "plan_change",
  "payment",
]);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: auditActionEnum("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_log_user_idx").on(t.userId),
    index("audit_log_action_idx").on(t.action),
    index("audit_log_created_idx").on(t.createdAt),
  ]
);

// --- Embed Widgets ---
export const embedWidgets = pgTable(
  "embed_widgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    customDomain: text("custom_domain"),
    config: jsonb("config").$type<{
      showBranding?: boolean;
      showSponsors?: boolean;
      maxWidth?: number;
      primaryColor?: string;
    }>(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("embed_widgets_event_idx").on(t.eventId),
    uniqueIndex("embed_widgets_domain_idx").on(t.customDomain),
  ]
);

// --- API Keys (for camera auto-upload / tethering) ---
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(), // First 8 chars for display (e.g. "bsp_1a2b...")
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    isRevoked: boolean("is_revoked").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("api_keys_user_idx").on(t.userId),
    index("api_keys_event_idx").on(t.eventId),
    index("api_keys_hash_idx").on(t.keyHash),
  ]
);

// --- Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  eventMembers: many(eventMembers),
  photos: many(photos),
  subscriptions: many(userSubscriptions),
  inviteTokens: many(inviteTokens),
}));

export const inviteTokensRelations = relations(inviteTokens, ({ one }) => ({
  user: one(users, { fields: [inviteTokens.userId], references: [users.id] }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  })
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  owner: one(users, { fields: [events.ownerId], references: [users.id] }),
  members: many(eventMembers),
  albums: many(albums),
  photos: many(photos),
  sponsors: many(sponsorBlocks),
  shareFrames: many(shareFrames),
  orders: many(orders),
  embedWidgets: many(embedWidgets),
}));

export const sponsorBlocksRelations = relations(sponsorBlocks, ({ one }) => ({
  event: one(events, {
    fields: [sponsorBlocks.eventId],
    references: [events.id],
  }),
}));

export const shareFramesRelations = relations(shareFrames, ({ one }) => ({
  event: one(events, {
    fields: [shareFrames.eventId],
    references: [events.id],
  }),
}));

export const eventMembersRelations = relations(eventMembers, ({ one }) => ({
  event: one(events, {
    fields: [eventMembers.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventMembers.userId],
    references: [users.id],
  }),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  event: one(events, { fields: [albums.eventId], references: [events.id] }),
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  event: one(events, { fields: [photos.eventId], references: [events.id] }),
  album: one(albums, { fields: [photos.albumId], references: [albums.id] }),
  uploader: one(users, { fields: [photos.uploadedBy], references: [users.id] }),
  orderItems: many(orderItems),
}));

export const participantsRelations = relations(
  participants,
  ({ one, many }) => ({
    event: one(events, {
      fields: [participants.eventId],
      references: [events.id],
    }),
    matches: many(participantMatches),
    orders: many(orders),
  })
);

export const participantMatchesRelations = relations(
  participantMatches,
  ({ one }) => ({
    participant: one(participants, {
      fields: [participantMatches.participantId],
      references: [participants.id],
    }),
    photo: one(photos, {
      fields: [participantMatches.photoId],
      references: [photos.id],
    }),
  })
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  event: one(events, { fields: [orders.eventId], references: [events.id] }),
  participant: one(participants, {
    fields: [orders.participantId],
    references: [participants.id],
  }),
  items: many(orderItems),
  transactions: many(paymentTransactions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  photo: one(photos, {
    fields: [orderItems.photoId],
    references: [photos.id],
  }),
}));

export const paymentTransactionsRelations = relations(
  paymentTransactions,
  ({ one }) => ({
    order: one(orders, {
      fields: [paymentTransactions.orderId],
      references: [orders.id],
    }),
  })
);

export const embedWidgetsRelations = relations(embedWidgets, ({ one }) => ({
  event: one(events, {
    fields: [embedWidgets.eventId],
    references: [events.id],
  }),
}));

export const userSubscriptionsRelations = relations(
  userSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [userSubscriptions.userId],
      references: [users.id],
    }),
    plan: one(subscriptionPlans, {
      fields: [userSubscriptions.planId],
      references: [subscriptionPlans.id],
    }),
  })
);

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ many }) => ({
    subscriptions: many(userSubscriptions),
  })
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
  event: one(events, { fields: [apiKeys.eventId], references: [events.id] }),
}));
