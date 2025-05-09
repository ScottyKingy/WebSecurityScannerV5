import { pgTable, text, serial, integer, boolean, timestamp, uuid, primaryKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Roles and Tiers
export const tierOrder = ["anonymous", "lite", "deep", "ultimate", "enterprise"] as const;
export type TierType = typeof tierOrder[number];

export const roleTypes = ["user", "admin"] as const;
export type RoleType = typeof roleTypes[number];

// User model
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  tier: text("tier").notNull().default("lite"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  isVerified: boolean("is_verified").default(false).notNull(),
});

// Credits Balance model
export const creditsBalances = pgTable("credits_balances", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).primaryKey(),
  currentBalance: integer("current_balance").notNull().default(0),
  monthlyAllotment: integer("monthly_allotment").notNull().default(0),
  rolloverEnabled: boolean("rollover_enabled").default(false).notNull(),
  rolloverExpiry: timestamp("rollover_expiry"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Credits Transaction model
export const creditsTransactions = pgTable("credits_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  metadata: text("metadata").default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Token model for refresh tokens
export const tokens = pgTable("tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, lastLogin: true, passwordHash: true, isVerified: true })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const insertCreditsBalanceSchema = createInsertSchema(creditsBalances).omit({
  updatedAt: true,
});

export const insertCreditsTransactionSchema = createInsertSchema(creditsTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
});

// Scan model
export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  primaryUrl: text("primary_url").notNull(),
  competitors: text("competitors").array().notNull(),
  status: text("status").notNull(), // queued | running | complete | failed
  scanType: text("scan_type").notNull(), // single | multi | competitor
  creditsUsed: integer("credits_used").notNull(),
  source: text("source").notNull(), // web | api | scheduled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  taskId: text("task_id"),
  scannerKeys: text("scanner_keys").array(),
  results: text("results"), // JSON string for legacy storage
  error: text("error"), // Error message if scan failed
  completedAt: timestamp("completed_at"),
});

// Insert schema for scans
export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Scan Results model
export const scanResults = pgTable("scan_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  scanId: uuid("scan_id").notNull().references(() => scans.id, { onDelete: "cascade" }),
  scannerKey: text("scanner_key").notNull(),
  score: integer("score").notNull(),
  outputJson: text("output_json").notNull(), // Storing as JSON string
  promptLog: text("prompt_log"), // Optional raw prompt + GPT output
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schema for scan results
export const insertScanResultSchema = createInsertSchema(scanResults).omit({
  id: true,
  createdAt: true,
});

// Types
// Audit logs for admin actions
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull().default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreditsBalance = typeof creditsBalances.$inferSelect;
export type CreditsTransaction = typeof creditsTransactions.$inferSelect;
export type Token = typeof tokens.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;
export type ScanResult = typeof scanResults.$inferSelect;
export type InsertScanResult = z.infer<typeof insertScanResultSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
