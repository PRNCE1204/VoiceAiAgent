/**
 * ChunkingService
 *
 * Intelligent text chunking that preserves paragraph and sentence boundaries.
 * Returns rich chunk objects with index and page metadata — not just strings.
 *
 * Algorithm:
 *   1. Split text on paragraph boundaries (\n\n) first — preserves semantic units
 *   2. If a paragraph exceeds chunkSize, sub-split by sentences
 *   3. Accumulate paragraphs/sentences into chunks up to chunkSize
 *   4. On overflow: save current chunk, carry overlap tail into next chunk
 *   5. Filter out empty or trivially small chunks
 *
 * Returns:
 *   Array of { text: string, chunkIndex: number, pageNumber: number|null }
 *
 * Backward-compatible export:
 *   chunkText(text, chunkSize, overlap) → string[] (legacy, used until Phase 2 migration)
 */

/**
 * Core chunking logic. Returns rich chunk objects.
 *
 * @param {string} text — Raw extracted text
 * @param {Object} options
 * @param {number} [options.chunkSize=800]  — Target max chars per chunk
 * @param {number} [options.overlap=200]    — Overlap chars carried to next chunk
 * @param {number|null} [options.pageNumber=null] — Page number if known (for PDF pages)
 * @returns {{ text: string, chunkIndex: number, pageNumber: number|null }[]}
 */
export function chunkTextRich(text, options = {}) {
    const { chunkSize = 800, overlap = 200, pageNumber = null } = options;

    if (!text || typeof text !== "string") return [];

    // Step 1: Normalize whitespace but preserve paragraph breaks (\n\n)
    const normalized = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ") // collapse horizontal whitespace
        .trim();

    if (!normalized) return [];

    // Step 2: Split by paragraphs (double newline = paragraph boundary)
    const paragraphs = normalized
        .split(/\n{2,}/)
        .map(p => p.replace(/\n/g, " ").trim())
        .filter(p => p.length > 0);

    const chunks = [];
    let currentChunk = "";
    let chunkIndex = 0;

    const saveChunk = (txt) => {
        const cleaned = txt.trim();
        if (cleaned.length >= 20) { // Ignore trivially small fragments
            chunks.push({
                text: cleaned,
                chunkIndex,
                pageNumber
            });
            chunkIndex++;
        }
    };

    for (const paragraph of paragraphs) {
        // If this single paragraph is larger than chunkSize, sub-split by sentences
        if (paragraph.length > chunkSize) {
            // Flush current chunk before processing large paragraph
            if (currentChunk.trim()) {
                saveChunk(currentChunk);
                // Carry overlap tail
                currentChunk = currentChunk.substring(
                    Math.max(0, currentChunk.length - overlap)
                );
            }

            // Split by sentence boundaries
            const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)/g) || [paragraph];
            for (const sentence of sentences) {
                if ((currentChunk + sentence).length > chunkSize) {
                    if (currentChunk.trim()) {
                        saveChunk(currentChunk);
                        // Carry overlap
                        currentChunk = currentChunk.substring(
                            Math.max(0, currentChunk.length - overlap)
                        );
                    }
                    currentChunk += sentence;
                } else {
                    currentChunk += sentence;
                }
            }
        } else {
            // Normal paragraph: try to fit it into the current chunk
            const candidate = currentChunk
                ? currentChunk + "\n\n" + paragraph
                : paragraph;

            if (candidate.length > chunkSize && currentChunk.trim()) {
                // Current chunk is full — save and start a new one with overlap
                saveChunk(currentChunk);
                const overlapTail = currentChunk.substring(
                    Math.max(0, currentChunk.length - overlap)
                );
                currentChunk = overlapTail + "\n\n" + paragraph;
            } else {
                currentChunk = candidate;
            }
        }
    }

    // Flush any remaining content
    if (currentChunk.trim()) {
        saveChunk(currentChunk);
    }

    return chunks;
}

/**
 * Chunk pages from a PDF (each page may have a known page number).
 *
 * @param {{ pageNumber: number, text: string }[]} pages — Array of page objects
 * @param {Object} options — Same as chunkTextRich options
 * @returns {{ text: string, chunkIndex: number, pageNumber: number }[]}
 */
export function chunkPages(pages, options = {}) {
    const allChunks = [];
    let globalIndex = 0;

    for (const page of pages) {
        if (!page.text || page.text.trim().length < 10) continue;

        const pageChunks = chunkTextRich(page.text, {
            ...options,
            pageNumber: page.pageNumber
        });

        // Re-index globally across all pages
        for (const chunk of pageChunks) {
            allChunks.push({
                ...chunk,
                chunkIndex: globalIndex++
            });
        }
    }

    return allChunks;
}

/**
 * Legacy backward-compatible export.
 * Returns plain string array. Used by existing code until Phase 2 migration.
 *
 * @param {string} text
 * @param {number} [chunkSize=600]
 * @param {number} [overlap=150]
 * @returns {string[]}
 */
export const chunkText = (text, chunkSize = 600, overlap = 150) => {
    return chunkTextRich(text, { chunkSize, overlap })
        .map(chunk => chunk.text);
};
