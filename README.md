# News Article Compiler V4.6 Bulk Export Minimal

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

Rectified cleaning:
- Less Strict mode now preserves the full news article and removes only exact obvious junk blocks.
- It explicitly keeps quotes, prices, statistics, names, dates, locations, examples, human-interest details and background context.
- Added safety fallback: if AI removes too much, the raw article is returned instead.

Bulk Less Strict cleaning update:
- Bulk Save now automatically calls api/cleanArticle.js with mode="loose".
- Each bulk article saves:
  - fullArticleRaw as original extracted article
  - fullArticleCleanedLoose as Less Strict AI-cleaned version
  - fullArticle as Less Strict AI-cleaned version
  - articleVersionSaved as "loose"

Export update:
- Excel export now includes only Source, Publication Date, URL, Saved Article Version.
- Word export now includes only Source, Publication Date, URL, Saved Article Version.
