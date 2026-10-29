import { inArray } from "drizzle-orm";
import { db } from "../db/index.ts";
import { shipments } from "../db/schema.ts";

type Shipment = typeof shipments.$inferSelect;

export type OrderLookup =
  | { orderId: string; matchedBy: "orderId"; shipment: Shipment | null }
  | {
      trackingNumber: string;
      matchedBy: "trackingNumber";
      shipment: Shipment | null;
    };

export const lookupOrders = async (
  orderIds: string[],
  trackingNumbers: string[],
): Promise<OrderLookup[]> => {
  const orderIdRows =
    orderIds.length > 0
      ? await db
          .select()
          .from(shipments)
          .where(inArray(shipments.orderId, orderIds))
      : [];
  const shipmentsByOrderId = new Map(
    orderIdRows.map((row) => [row.orderId, row]),
  );

  const trackingNumberRows =
    trackingNumbers.length > 0
      ? await db
          .select()
          .from(shipments)
          .where(inArray(shipments.trackingNumber, trackingNumbers))
      : [];
  const shipmentsByTrackingNumber = new Map(
    trackingNumberRows.map((row) => [row.trackingNumber, row]),
  );

  const orderIdLookups = orderIds.map(
    (orderId): OrderLookup => ({
      orderId,
      matchedBy: "orderId",
      shipment: shipmentsByOrderId.get(orderId) ?? null,
    }),
  );

  const trackingNumberLookups = trackingNumbers
    .map(
      (trackingNumber): OrderLookup => ({
        trackingNumber,
        matchedBy: "trackingNumber",
        shipment: shipmentsByTrackingNumber.get(trackingNumber) ?? null,
      }),
    )
    .filter(
      (lookup) =>
        !lookup.shipment || !shipmentsByOrderId.has(lookup.shipment.orderId),
    );

  return [...orderIdLookups, ...trackingNumberLookups];
};
