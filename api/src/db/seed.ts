import { readFileSync } from "node:fs";
import { db } from "./index.ts";
import { merchants, shipments } from "./schema.ts";

// Postgres enums, FKs and NOT NULLs reject malformed seed rows, so no extra validation here.
const load = <T>(file: string): T => JSON.parse(readFileSync(new URL(`../../../data/seed/${file}`, import.meta.url), "utf8"));

const merchantRows = load<(typeof merchants.$inferInsert)[]>("merchants.json");
const shipmentRows = load<(typeof shipments.$inferInsert)[]>("shipments.json");

// Wipe and reinsert in one transaction so a failed seed leaves the old data intact.
await db.transaction(async (tx) => {
  await tx.delete(shipments);
  await tx.delete(merchants);
  await tx.insert(merchants).values(merchantRows);
  await tx.insert(shipments).values(shipmentRows);
});

console.log(`Seeded ${merchantRows.length} merchants, ${shipmentRows.length} shipments`);
await db.$client.end();
