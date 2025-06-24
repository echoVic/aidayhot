"use strict";
/**
 * TypeScript Crawlers Export Module
 * Provides centralized access to all crawler implementations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerMigrationHelper = exports.CrawlerManager = exports.crawlerFactory = exports.StackOverflowCrawler = exports.RSSCrawler = exports.PapersWithCodeCrawler = exports.GitHubCrawler = exports.ArxivCrawler = exports.BaseCrawler = void 0;
exports.testAllCrawlers = testAllCrawlers;
// Export types
__exportStar(require("./types"), exports);
// Export base crawler
var BaseCrawler_1 = require("./BaseCrawler");
Object.defineProperty(exports, "BaseCrawler", { enumerable: true, get: function () { return BaseCrawler_1.BaseCrawler; } });
// Export specific crawlers
var ArxivCrawler_1 = require("./ArxivCrawler");
Object.defineProperty(exports, "ArxivCrawler", { enumerable: true, get: function () { return ArxivCrawler_1.ArxivCrawler; } });
var GitHubCrawler_1 = require("./GitHubCrawler");
Object.defineProperty(exports, "GitHubCrawler", { enumerable: true, get: function () { return GitHubCrawler_1.GitHubCrawler; } });
var PapersWithCodeCrawler_1 = require("./PapersWithCodeCrawler");
Object.defineProperty(exports, "PapersWithCodeCrawler", { enumerable: true, get: function () { return PapersWithCodeCrawler_1.PapersWithCodeCrawler; } });
var RSSCrawler_1 = require("./RSSCrawler");
Object.defineProperty(exports, "RSSCrawler", { enumerable: true, get: function () { return RSSCrawler_1.RSSCrawler; } });
var StackOverflowCrawler_1 = require("./StackOverflowCrawler");
Object.defineProperty(exports, "StackOverflowCrawler", { enumerable: true, get: function () { return StackOverflowCrawler_1.StackOverflowCrawler; } });
// Legacy JavaScript crawlers have been removed
// All crawlers should now be implemented in TypeScript
// Crawler factory
const ArxivCrawler_2 = require("./ArxivCrawler");
const GitHubCrawler_2 = require("./GitHubCrawler");
exports.crawlerFactory = {
    createArxivCrawler(options) {
        return new ArxivCrawler_2.ArxivCrawler(options);
    },
    createGitHubCrawler(token, options) {
        return new GitHubCrawler_2.GitHubCrawler(token, options);
    },
};
// Crawler manager for handling multiple crawlers
class CrawlerManager {
    constructor() {
        this.crawlers = new Map();
    }
    /**
     * Register a crawler with a unique name
     */
    register(name, crawler) {
        if (this.crawlers.has(name)) {
            console.warn(`[CrawlerManager] Overwriting existing crawler: ${name}`);
        }
        this.crawlers.set(name, crawler);
    }
    /**
     * Get a registered crawler by name
     */
    get(name) {
        const crawler = this.crawlers.get(name);
        if (!crawler) {
            console.warn(`[CrawlerManager] Crawler not found: ${name}`);
        }
        return crawler;
    }
    /**
     * Get all registered crawler names
     */
    getNames() {
        return Array.from(this.crawlers.keys());
    }
    /**
     * Check health of all registered crawlers
     */
    async checkHealth() {
        const healthChecks = {};
        for (const [name, crawler] of this.crawlers) {
            try {
                if (typeof crawler.validateConfig === 'function') {
                    const isValid = crawler.validateConfig();
                    healthChecks[name] = { healthy: isValid };
                }
                else {
                    healthChecks[name] = { healthy: true };
                }
            }
            catch (error) {
                healthChecks[name] = {
                    healthy: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        }
        return healthChecks;
    }
    /**
     * Run all crawlers with optional timeout
     */
    async runAll(options) {
        const results = {};
        const timeout = options?.timeout || 30000;
        const promises = Array.from(this.crawlers.entries()).map(async ([name, crawler]) => {
            try {
                if (typeof crawler.crawl === 'function') {
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout));
                    const result = await Promise.race([
                        crawler.crawl(),
                        timeoutPromise,
                    ]);
                    results[name] = result;
                }
                else {
                    results[name] = { error: 'Crawler does not implement crawl method' };
                }
            }
            catch (error) {
                results[name] = {
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        });
        await Promise.allSettled(promises);
        return results;
    }
}
exports.CrawlerManager = CrawlerManager;
// Test utility function
async function testAllCrawlers() {
    console.log('🧪 Testing all TypeScript crawlers...');
    try {
        // Test ArXiv crawler
        const arxivCrawler = new ArxivCrawler_2.ArxivCrawler();
        console.log('📄 Testing ArXiv crawler...');
        const arxivResult = await arxivCrawler.testConnection();
        console.log(`ArXiv: ${arxivResult.success ? '✅' : '❌'} (${arxivResult.papers?.length || 0} papers)`);
        // Test GitHub crawler
        const githubCrawler = new GitHubCrawler_2.GitHubCrawler();
        console.log('🐙 Testing GitHub crawler...');
        const githubResult = await githubCrawler.testConnection();
        console.log(`GitHub: ${githubResult.success ? '✅' : '❌'}`);
    }
    catch (error) {
        console.error('❌ Crawler testing failed:', error);
    }
}
// Migration helper for converting JS results to TS types
class CrawlerMigrationHelper {
    /**
     * Convert old JavaScript ArXiv results to TypeScript format
     */
    static convertArxivResult(jsResult) {
        return {
            success: jsResult.success || false,
            query: jsResult.query || '',
            totalResults: jsResult.totalResults || 0,
            papers: jsResult.papers || [],
            crawledAt: jsResult.crawledAt ? new Date(jsResult.crawledAt) : new Date(),
            error: jsResult.error,
        };
    }
    /**
     * Convert old JavaScript GitHub results to TypeScript format
     */
    static convertGitHubResult(jsResult) {
        return {
            success: jsResult.success || false,
            query: jsResult.query,
            username: jsResult.username,
            repositories: jsResult.repositories || [],
            crawledAt: jsResult.crawledAt ? new Date(jsResult.crawledAt) : new Date(),
            error: jsResult.error,
        };
    }
}
exports.CrawlerMigrationHelper = CrawlerMigrationHelper;
