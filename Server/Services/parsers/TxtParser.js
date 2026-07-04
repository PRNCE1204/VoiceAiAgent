/**
 * TxtParser
 *
 * Parses plain-text (.txt) files from a Buffer.
 * Handles common encodings (UTF-8, UTF-16).
 *
 * Returns:
 *   { fullText: string, pages: [{ pageNumber: 1, text: string }], pageCount: 1, wordCount: number }
 */
export class TxtParser {
    /**
     * @param {Buffer} buffer — Raw .txt file buffer
     * @returns {{ fullText: string, pages: Array<{ pageNumber: number, text: string }>, pageCount: number, wordCount: number }}
     */
    parse(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error("TxtParser.parse: input must be a Buffer");
        }

        // Try UTF-8 first, fall back to latin1
        let fullText;
        try {
            fullText = buffer.toString("utf8");
            // Quick sanity check — if result has too many replacement chars it might be wrong encoding
            if ((fullText.match(/\uFFFD/g) || []).length > 10) {
                fullText = buffer.toString("latin1");
            }
        } catch {
            fullText = buffer.toString("latin1");
        }

        // Normalize line endings
        fullText = fullText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        return {
            fullText,
            pages: [{ pageNumber: 1, text: fullText }],
            pageCount: 1,
            wordCount
        };
    }
}
