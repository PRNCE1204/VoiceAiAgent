import * as cheerio from "cheerio";

/**
 * CrawlerService
 *
 * Production-grade web crawler for knowledge base ingestion.
 *
 * Features:
 *   - Removes nav, footer, header, sidebar, script, style, ads
 *   - Handles relative → absolute URL conversion
 *   - Deduplicates visited URLs (normalized)
 *   - Skips non-HTML resources (images, PDFs, downloads)
 *   - Respects configurable maxDepth and maxPages limits
 *   - Prevents infinite loops via visited URL set
 *   - Minimum content length threshold
 *   - Returns array of page objects for multi-page ingestion
 *   - Supports single-page mode (depth=0)
 *
 * Usage:
 *   const crawler = new CrawlerService();
 *   const pages = await crawler.crawl("https://example.com", { maxDepth: 2 });
 *   // pages: [{ url, title, text, depth }]
 */
export class CrawlerService {
    constructor() {
        this.DEFAULT_OPTIONS = {
            maxDepth: 2,
            maxPages: 25,
            minContentLength: 150,
            timeout: 12000,
            userAgent: "Mozilla/5.0 (compatible; ShifraAI-Crawler/1.0; +https://shifraai.com/bot)"
        };

        // HTML tags to remove before extracting text
        this.NOISE_SELECTORS = [
            "script",
            "style",
            "nav",
            "header",
            "footer",
            "aside",
            "iframe",
            "noscript",
            "svg",
            "form",
            "[role='navigation']",
            "[role='banner']",
            "[role='contentinfo']",
            ".nav",
            ".navbar",
            ".navigation",
            ".menu",
            ".sidebar",
            ".footer",
            ".header",
            ".cookie-banner",
            ".advertisement",
            ".ad",
            "#nav",
            "#header",
            "#footer",
            "#sidebar"
        ].join(", ");

        // Skip URLs matching these patterns
        this.SKIP_EXTENSIONS = /\.(pdf|jpg|jpeg|png|gif|webp|svg|mp4|mp3|zip|gz|exe|dmg|doc|docx|xls|xlsx|ppt|pptx|css|js|json|xml|ico|woff|woff2|ttf|eot)$/i;
        this.SKIP_PROTOCOLS = /^(mailto:|tel:|javascript:|data:|#)/;
    }

    /**
     * Crawl a website starting from the given URL.
     *
     * @param {string} startUrl — The root URL to crawl
     * @param {Object} options
     * @param {number} [options.maxDepth=2]      — Max link depth from start URL (0 = single page)
     * @param {number} [options.maxPages=25]     — Max total pages to fetch
     * @param {number} [options.minContentLength=150] — Minimum chars to include a page
     * @param {number} [options.timeout=12000]   — HTTP request timeout in ms
     * @returns {Promise<Array<{ url: string, title: string, text: string, depth: number }>>}
     */
    async crawl(startUrl, options = {}) {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };

        // Validate and parse start URL
        let parsedStart;
        try {
            parsedStart = new URL(startUrl);
        } catch {
            throw new Error(`CrawlerService: Invalid URL — ${startUrl}`);
        }

        const visited = new Set();
        const results = [];
        const queue = [{ url: startUrl, depth: 0 }];

        console.log(`[CrawlerService] Starting crawl: ${startUrl} (maxDepth=${opts.maxDepth}, maxPages=${opts.maxPages})`);

        while (queue.length > 0 && results.length < opts.maxPages) {
            const { url, depth } = queue.shift();
            const normalizedUrl = this._normalizeUrl(url);

            if (visited.has(normalizedUrl)) continue;
            visited.add(normalizedUrl);

            // Skip non-HTTP/HTTPS
            if (!url.startsWith("http://") && !url.startsWith("https://")) continue;

            // Skip URLs that look like file downloads
            if (this.SKIP_EXTENSIONS.test(url)) {
                console.log(`[CrawlerService] Skipping resource: ${url}`);
                continue;
            }

            let html;
            try {
                html = await this._fetchPage(url, opts);
            } catch (err) {
                console.warn(`[CrawlerService] Failed to fetch ${url}: ${err.message}`);
                continue;
            }

            const $ = cheerio.load(html);

            // Extract page title
            const title = $("title").text().trim() || $("h1").first().text().trim() || url;

            // Remove noise elements
            $(this.NOISE_SELECTORS).remove();

            // Extract main content — prefer semantic main element
            let contentEl = $("main, article, [role='main'], #content, #main, .content, .main");
            if (contentEl.length === 0) {
                contentEl = $("body");
            }

            const rawText = contentEl.text();
            const text = this._cleanText(rawText);

            if (text.length >= opts.minContentLength) {
                results.push({ url, title, text, depth });
                console.log(`[CrawlerService] ✓ ${url} — ${text.length} chars (depth ${depth})`);
            } else {
                console.log(`[CrawlerService] Skipping thin page (${text.length} chars): ${url}`);
            }

            // Discover links for deeper crawling (only if within depth limit)
            if (depth < opts.maxDepth) {
                $("a[href]").each((_, el) => {
                    const href = $(el).attr("href");
                    if (!href) return;

                    // Skip anchors, protocols, file downloads
                    if (this.SKIP_PROTOCOLS.test(href)) return;
                    if (this.SKIP_EXTENSIONS.test(href)) return;

                    // Resolve relative URLs
                    let absoluteUrl;
                    try {
                        absoluteUrl = new URL(href, url).href;
                    } catch {
                        return; // Malformed URL
                    }

                    // Only crawl same-domain links
                    const parsedLink = new URL(absoluteUrl);
                    if (parsedLink.hostname !== parsedStart.hostname) return;

                    // Remove fragments for dedup
                    absoluteUrl = absoluteUrl.split("#")[0];
                    const normalizedLink = this._normalizeUrl(absoluteUrl);

                    if (!visited.has(normalizedLink) && results.length < opts.maxPages) {
                        queue.push({ url: absoluteUrl, depth: depth + 1 });
                    }
                });
            }
        }

        console.log(`[CrawlerService] Crawl complete: ${results.length} pages collected from ${visited.size} visited URLs`);
        return results;
    }

    /**
     * Crawl a single page only (no link following).
     * Equivalent to crawl(url, { maxDepth: 0, maxPages: 1 })
     */
    async crawlSingle(url, options = {}) {
        return this.crawl(url, { ...options, maxDepth: 0, maxPages: 1 });
    }

    /**
     * Fetch a page and return HTML string.
     * @private
     */
    async _fetchPage(url, opts) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), opts.timeout);

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": opts.userAgent,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5"
                },
                signal: controller.signal,
                redirect: "follow"
            });

            clearTimeout(timer);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
                throw new Error(`Not an HTML page (Content-Type: ${contentType})`);
            }

            return await response.text();
        } catch (err) {
            clearTimeout(timer);
            throw err;
        }
    }

    /**
     * Clean raw extracted text.
     * @private
     */
    _cleanText(raw) {
        return raw
            .replace(/\t/g, " ")
            .replace(/[ ]{3,}/g, "  ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    /**
     * Normalize URL for dedup: lowercase scheme+host, remove trailing slash.
     * @private
     */
    _normalizeUrl(url) {
        try {
            const u = new URL(url);
            let normalized = `${u.protocol.toLowerCase()}//${u.hostname.toLowerCase()}${u.pathname}${u.search}`;
            if (normalized.endsWith("/")) {
                normalized = normalized.slice(0, -1);
            }
            return normalized;
        } catch {
            return url;
        }
    }
}
