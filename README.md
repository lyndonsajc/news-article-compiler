# News Article Compiler V4.4

Includes:
- Firestore storage
- Passcode 7728
- Full article storage
- AI summary
- General keywords
- Economic keywords
- Date range search
- Source filter
- Compact display
- Bulk URL saving
- Duplicate URL detection
- Export JSON, Excel, Word
- Import JSON

Vercel env var required:
OPENROUTER_API_KEY

V4.1 changes:
- Removed long individual publication date button list
- Added date range search
- Added preset buttons: Last 7 Days, Last 30 Days, This Month, This Year
- General keywords and economic terms now appear in fixed-height scrollable boxes

V4.2 changes:
- AI removes advertisements and non-news content before saving/summarising
- Stores cleaned article text
- Adds economics concepts field
- Adds quick search by economics concepts

V4.3 fix:
- AI cleaning no longer overwrites raw extracted article text
- App stores both fullArticleRaw and fullArticleCleaned
- Display shows both AI-cleaned article and raw full article
- If AI cleaning removes too much, raw article is still preserved and saved

V4.4 change:
- AI cleaning is restricted to removing only advertisements, sponsored content, related articles, read more sections, subscription prompts, newsletter prompts, social media links, navigation menus, footer text, copyright text, repeated content, image galleries, video descriptions and share buttons.
- All other article content is kept unchanged.
