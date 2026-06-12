# News Article Compiler V4.5

Change:
- AI no longer cleans, rewrites, shortens, removes, or edits article content.
- Full raw article is preserved exactly as extracted/pasted.
- AI only generates: title, source, publication date, summary, keywords, economic keywords, economics concepts.
- OpenRouter API is used via api/summarize.js.

Required Vercel environment variable:
OPENROUTER_API_KEY

Optional:
OPENROUTER_MODEL
