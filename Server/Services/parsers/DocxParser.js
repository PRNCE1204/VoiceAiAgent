/**
 * DocxParser
 *
 * Parses Microsoft Word (.docx) files using the `mammoth` library.
 * mammoth converts DOCX to HTML then we strip the HTML to get clean text.
 *
 * Requires: npm install mammoth
 *
 * Returns:
 *   { fullText: string, pages: [{ pageNumber: 1, text: string }], pageCount: 1, wordCount: number }
 */
export class DocxParser {
    /**
     * @param {Buffer} buffer — Raw .docx file buffer
     * @returns {Promise<{ fullText: string, pages: Array<{ pageNumber: number, text: string }>, pageCount: number, wordCount: number }>}
     */
    async parse(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error("DocxParser.parse: input must be a Buffer");
        }

        let mammoth;
        try {
            mammoth = (await import("mammoth")).default;
        } catch {
            throw new Error(
                "DocxParser: mammoth is not installed. Run: cd Server && npm install mammoth"
            );
        }

        let result;
        try {
            result = await mammoth.extractRawText({ buffer });
        } catch (err) {
            throw new Error(`DocxParser: Failed to parse DOCX — ${err.message}`);
        }

        if (result.messages && result.messages.length > 0) {
            const warnings = result.messages
                .filter(m => m.type === "warning")
                .map(m => m.message);
            if (warnings.length > 0) {
                console.warn(`[DocxParser] Warnings: ${warnings.join("; ")}`);
            }
        }

        const fullText = (result.value || "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        if (!fullText) {
            throw new Error("DocxParser: No text could be extracted from this DOCX file.");
        }

        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        return {
            fullText,
            pages: [{ pageNumber: 1, text: fullText }],
            pageCount: 1,
            wordCount
        };
    }
}
