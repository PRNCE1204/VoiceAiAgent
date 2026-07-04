/**
 * MarkdownParser
 *
 * Parses Markdown (.md) files and converts them to clean plain text
 * suitable for embedding — without requiring any extra dependencies.
 *
 * Stripping approach:
 *   - Remove code blocks (``` ... ```) — code rarely improves embedding quality
 *   - Remove inline code (`...`)
 *   - Remove images ![alt](url)
 *   - Convert links [text](url) → text
 *   - Strip ATX headings (# ## ###) but preserve the heading text
 *   - Strip bold/italic markers (** __ * _)
 *   - Strip blockquotes (>)
 *   - Strip horizontal rules (--- ***)
 *   - Strip HTML tags
 *   - Preserve list items as plain sentences
 *
 * Returns:
 *   { fullText: string, pages: [{ pageNumber: 1, text: string }], pageCount: 1, wordCount: number }
 */
export class MarkdownParser {
    /**
     * @param {Buffer} buffer — Raw .md file buffer
     * @returns {{ fullText: string, pages: Array<{ pageNumber: number, text: string }>, pageCount: number, wordCount: number }}
     */
    parse(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error("MarkdownParser.parse: input must be a Buffer");
        }

        let raw = buffer.toString("utf8");

        // 1. Remove fenced code blocks (``` or ~~~)
        raw = raw.replace(/```[\s\S]*?```/g, "");
        raw = raw.replace(/~~~[\s\S]*?~~~/g, "");

        // 2. Remove inline code
        raw = raw.replace(/`[^`]+`/g, "");

        // 3. Remove images
        raw = raw.replace(/!\[([^\]]*)\]\([^)]*\)/g, "");

        // 4. Convert links to text only
        raw = raw.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

        // 5. Strip heading markers but keep text
        raw = raw.replace(/^#{1,6}\s+/gm, "");

        // 6. Strip bold/italic markers
        raw = raw.replace(/(\*\*|__)(.*?)\1/g, "$2");
        raw = raw.replace(/(\*|_)(.*?)\1/g, "$2");

        // 7. Strip blockquotes
        raw = raw.replace(/^>\s*/gm, "");

        // 8. Strip horizontal rules
        raw = raw.replace(/^[-*_]{3,}\s*$/gm, "");

        // 9. Strip HTML tags
        raw = raw.replace(/<[^>]+>/g, "");

        // 10. Convert list markers to plain text (- item → item)
        raw = raw.replace(/^[\s]*[-*+]\s+/gm, "");
        raw = raw.replace(/^[\s]*\d+\.\s+/gm, "");

        // 11. Normalize whitespace
        const fullText = raw
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        return {
            fullText,
            pages: [{ pageNumber: 1, text: fullText }],
            pageCount: 1,
            wordCount
        };
    }
}
