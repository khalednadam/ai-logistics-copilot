type DocumentChunk = {
  chunkIndex: number;
  content: string;
};

type ChunkedDocument = {
  title: string;
  chunks: DocumentChunk[];
};

export const chunkDocument = (markdown: string): ChunkedDocument => {
  const titleMatch = markdown.match(/^# (.+)$/m);
  if (!titleMatch) {
    throw new Error("No title found in markdown");
  }
  const sections = markdown
    .split(/^## /m)
    .slice(1)
    .map((section) => section.trim());
  return {
    title: titleMatch[1],
    chunks: sections.map((section, index) => ({
      chunkIndex: index,
      content: `${titleMatch[1]}\n${section}`,
    })),
  };
};
