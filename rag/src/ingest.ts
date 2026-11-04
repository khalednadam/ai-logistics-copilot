import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { db } from "../../api/src/db/index.ts";
import { chunks, documents } from "../../api/src/db/schema.ts";
import { eq } from "drizzle-orm";
import { chunkDocument } from "./chunk.ts";
import { embedTexts } from "./embed.ts";

const docsDirectory = new URL("../../data/docs/", import.meta.url);
const files = readdirSync(docsDirectory);
for (const fileName of files.filter((fileName) => fileName.endsWith(".md"))) {
  const markdown = readFileSync(new URL(fileName, docsDirectory), "utf8");
  const contentHash = createHash("sha256").update(markdown).digest("hex");
  const documentId = fileName.replace(/\.md$/, "");

  const [existing] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (existing?.contentHash === contentHash) {
    console.log(`Skipped ${documentId}`);
    continue;
  }

  const { title, chunks: documentChunks } = chunkDocument(markdown);
  const embeddings = await embedTexts(
    documentChunks.map((chunk) => chunk.content),
    "document",
  );

  await db.transaction(async (tx) => {
    await tx.delete(documents).where(eq(documents.id, documentId));
    await tx.insert(documents).values({ id: documentId, title, contentHash });
    await tx.insert(chunks).values(
      documentChunks.map((documentChunk, index) => ({
        documentId,
        chunkIndex: documentChunk.chunkIndex,
        content: documentChunk.content,
        embedding: embeddings[index],
      })),
    );
  });
}

await db.$client.end();
