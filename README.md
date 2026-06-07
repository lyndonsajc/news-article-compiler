# News Article Compiler

A Vercel-ready app for compiling news articles.

## Features

- User can paste an article URL
- User can upload a PDF
- App creates a readable article section
- AI fills in article title, source, summary and keywords
- Display page shows saved articles
- Quick search buttons by date
- Quick search buttons by keywords
- Search box searches across title, source, summary, article text and keywords
- Import/export backup JSON
- OpenRouter API key is hidden in a Vercel serverless function

## Set up on Vercel

1. Upload these files to GitHub.
2. Import the GitHub repo into Vercel.
3. In Vercel, go to Project Settings > Environment Variables.
4. Add:

OPENROUTER_API_KEY = your OpenRouter key

Optional:

OPENROUTER_MODEL = openai/gpt-4o-mini

5. Redeploy.

## Important

Do not paste your OpenRouter key into `index.html`.
Do not commit your API key to GitHub.
