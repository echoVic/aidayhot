"use strict";

// Export all crawlers
const { ArxivCrawler } = require('./ArxivCrawler');
const { GitHubCrawler } = require('./GitHubCrawler');
const { RSSCrawler } = require('./RSSCrawler');
const { PapersWithCodeCrawler } = require('./PapersWithCodeCrawler');
const { StackOverflowCrawler } = require('./StackOverflowCrawler');
const { BaseCrawler } = require('./BaseCrawler');

module.exports = {
    ArxivCrawler,
    GitHubCrawler,
    RSSCrawler,
    PapersWithCodeCrawler,
    StackOverflowCrawler,
    BaseCrawler
}; 