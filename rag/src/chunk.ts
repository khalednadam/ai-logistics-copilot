type DocumentChunk = {
  chunkIndex: number;
  content: string;
};

type ChunkedDocument = {
  title: string;
  chunks: DocumentChunk[];
};

export function chunkDocument(document: string): ChunkedDocument {
  const chunks: DocumentChunk[] = [];
  const lines = document.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      chunks.push({ chunkIndex: i, content: line });
    }
  }
  return { title: document.split("\n")[0], chunks };
}
