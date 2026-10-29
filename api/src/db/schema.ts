import { char, date, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const originHub = pgEnum("origin_hub", ["shenzhen", "yiwu"]);
export const incoterm = pgEnum("incoterm", ["DDP", "DDU"]);
export const shipmentStatus = pgEnum("shipment_status", [
  "label_created",
  "in_transit",
  "customs_hold",
  "out_for_delivery",
  "delivered",
  "exception",
  "returned",
]);

export const merchants = pgTable("merchants", {
  id: text().primaryKey(),
  name: text().notNull(),
  contactEmail: text().notNull().unique(),
  country: char({ length: 2 }).notNull(),
});

export type ShipmentItem = {
  sku: string;
  description: string;
  hsCode: string;
  quantity: number;
  unitValueCents: number;
  containsBattery: boolean;
};

export const shipments = pgTable("shipments", {
  orderId: text().primaryKey(),
  merchantId: text()
    .notNull()
    .references(() => merchants.id),
  originHub: originHub().notNull(),
  destinationCountry: char({ length: 2 }).notNull(),
  status: shipmentStatus().notNull(),
  carrier: text().notNull(),
  trackingNumber: text().notNull().unique(),
  incoterm: incoterm().notNull(),
  declaredValueCents: integer().notNull(),
  currency: char({ length: 3 }).notNull(),
  items: jsonb().$type<ShipmentItem[]>().notNull(),
  estimatedDelivery: date(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

