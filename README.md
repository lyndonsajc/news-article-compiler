# News Article Compiler V4.7

Change:
- AI no longer cleans, rewrites, shortens, removes, or edits article content.
- Full raw article is preserved exactly as extracted/pasted.
- AI only generates: title, source, publication date, summary, keywords, economic keywords, economics concepts.
- OpenRouter API is used via api/summarize.js.

Required Vercel environment variable:
OPENROUTER_API_KEY

Optional:
OPENROUTER_MODEL

V4.6 changes:
- Added optional AI cleaning with two modes:
  1. Less Strict Cleaned Version
  2. Strict Cleaned Version
- Raw article remains preserved.
- User can choose which version to save: raw, less strict, or strict.
- Added api/cleanArticle.js using OpenRouter.

V4.7 changes:
- Sleek dark compact interface inspired by Bookmark Vault
- Two-column compact article cards
- Collapsed article details by default
- AI tools moved into collapsible panel
- Compact Search & Filters area
