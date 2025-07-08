# CLAUDE.md

always respond in Chinese

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server
- `pnpm build` - Build production version
- `pnpm lint` - Run ESLint
- `pnpm start` - Start production server

### Data Collection
- `pnpm setup` - Quick setup for data collection
- `pnpm collect` - Run full data collection
- `pnpm collect:test` - Test data collection with limited results
- `pnpm collect:arxiv` - Collect from Arxiv papers
- `pnpm collect:github` - Collect from GitHub trending
- `pnpm collect:rss` - Collect from RSS feeds

### Database Management
- `pnpm create-tables` - Create database tables
- `pnpm import-rss` - Import RSS sources
- `pnpm sync-rss-sources` - Sync RSS sources
- `pnpm update-article-categories` - Update article categories
- `pnpm migrate:check` - Check migration status
- `pnpm migrate:cleanup` - Clean up migration data

### Testing
- `node test/runAllCrawlerTests.js` - Run all crawler tests
- `node test/testArxivCrawler.js` - Test Arxiv crawler
- `node test/testGitHubCrawler.js` - Test GitHub crawler

## Architecture Overview

### Configuration-Driven Design
The project uses a configuration-driven architecture centered around `src/config/pageConfig.ts`. Each page (homepage, tech, research, community) has its own configuration defining:
- Source types to collect from
- Feed categories to display
- Page metadata

### Data Layer
- **Database**: Supabase PostgreSQL with two main tables:
  - `articles`: Contains all content with metadata, tags, and engagement metrics
  - `feed_sources`: RSS source configurations
- **Data Service**: `src/lib/database.ts` provides pagination, search, filtering, and statistics
- **Real-time**: Uses Supabase real-time subscriptions

### Crawler System
Modular crawler system in `src/crawlers/` with specialized crawlers:
- `ArxivCrawler`: Academic papers from Arxiv
- `GitHubCrawler`: Trending repositories
- `RSSCrawler`: RSS feed aggregation
- `BaseCrawler`: Common crawler functionality

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with Tailwind CSS 4
- **Components**: Modular system with content cards, layout components, and mobile navigation
- **Error Handling**: React Error Boundary with toast notifications

## Key Technical Details

### Page Structure
```
src/app/
├── layout.tsx          # Root layout with navigation
├── page.tsx           # Homepage (AI news aggregation)
├── tech/              # Technical content (GitHub, Stack Overflow)
├── research/          # Academic papers (Arxiv)
└── community/         # Community content (RSS, social media)
```

### Data Flow
1. Crawlers collect data from various sources
2. Data is processed and stored in Supabase
3. Pages fetch data using configuration-driven queries
4. Components render content with pagination and search

### Configuration Files
- `next.config.ts`: Image optimization and webpack exclusions for crawlers
- `eslint.config.mjs`: ESLint 9 flat config, excludes crawlers and tests
- `tsconfig.json`: TypeScript strict mode with path mapping

### Environment Variables
Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `GITHUB_TOKEN` (for GitHub API rate limiting)

## Important Patterns

### Component Organization
- Content cards (ArticleCard, ArxivCard, GitHubCard) handle different data types
- Layout components (Header, Sidebar, MainContent) provide consistent structure
- Mobile-first responsive design with bottom navigation

### Error Handling
- React Error Boundary wraps main content
- Toast notifications for user feedback
- Graceful degradation for network errors

### Performance Optimization
- Image lazy loading with Next.js Image component
- Pagination with infinite scroll
- Database indexing on frequently queried fields
- Component-level loading states

### Data Processing
- Articles are deduplicated using `content_id`
- Categories are standardized through configuration
- Tags are processed and normalized
- Engagement metrics (views, likes) are tracked

## Development Notes

### Crawler Development
- Crawlers are excluded from Next.js build via webpack config
- Use `tsx` for running TypeScript crawler scripts
- Test crawlers individually before running full collection
- Rate limiting is implemented to respect API limits

### Database Schema
The `articles` table includes:
- Standard fields: title, summary, author, publish_time
- Metadata: source_url, source_type, category, tags
- Engagement: views, likes, is_hot, is_new
- Technical: content_id (for deduplication), metadata (JSON)

### Mobile Considerations
- Bottom navigation for mobile devices
- Modal-based search interface
- Touch-friendly interaction patterns
- Responsive grid layouts

This codebase emphasizes modularity, type safety, and maintainability while handling real-time data aggregation from multiple sources.