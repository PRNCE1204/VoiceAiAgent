import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

/**
 * PdfParser
 *
 * Extracts text from PDF buffers using pdf-parse.
 * Preserves per-page text so chunks can carry accurate page numbers.
 *
 * Returns:
 *   {
 *     fullText: string,              // Concatenated text of all pages
 *     pages: [{ pageNumber, text }], // Per-page breakdown
 *     pageCount: number,
 *     wordCount: number
 *   }
 */
export class PdfParser {
    /**
     * @param {Buffer} buffer — Raw PDF file buffer
     * @returns {Promise<{ fullText: string, pages: Array<{ pageNumber: number, text: string }>, pageCount: number, wordCount: number }>}
     */
    async parse(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error("PdfParser.parse: input must be a Buffer");
        }

        let parser;
        try {
            // Convert Buffer to Uint8Array as expected by PDFParse
            const dataArray = new Uint8Array(buffer);
            parser = new PDFParse({ data: dataArray });

            const textResult = await parser.getText();
            const fullText = textResult.text || "";
            const pages = textResult.pages.map((page) => ({
                pageNumber: page.num,
                text: page.text
            }));
            const pageCount = textResult.total || pages.length;
            const wordCount = fullText.split(/\s+/).filter(Boolean).length;

            return {
                fullText,
                pages,
                pageCount,
                wordCount
            };
        } catch (err) {
            throw new Error(`PdfParser: Failed to parse PDF — ${err.message}`);
        } finally {
            if (parser && typeof parser.destroy === "function") {
                await parser.destroy().catch(() => {});
            }
        }
    }
}

