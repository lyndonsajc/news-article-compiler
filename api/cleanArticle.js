function stripMarkdownNoise(text = "") {
  return String(text)
    .replace(/\r/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/!Image\s*\d+[^\n]*/gi, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isJunkLine(line = "") {
  const l = line.trim();
  if (!l) return false;
  const compact = l.replace(/\s+/g, " ").trim();

  const exact = new Set([
    "Skip to main content", "Sign In", "Account", "My Feed", "Edition Menu", "Edition:", "World", "Singapore", "Indonesia", "Asia",
    "Search", "Close", "All", "FAST", "BookmarkBookmarkShare", "WhatsAppTelegramFacebookTwitterEmailLinkedIn", "Facebook", "X", "Youtube", "LinkedIn", "RSS",
    "Advertisement", "ADVERTISEMENT", "Show More", "Show Less", "Newsletter", "Subscribe here", "Download here", "Join here", "More…", "Thanks for sharing!", "AddToAny",
    "Follow our news", "Recent Searches", "Trending Topics", "Set CNA as your preferred source on Google", "Read a summary of this article on FAST.",
    "Get bite-sized news via a new", "cards interface. Give it a try.", "Click here to return to FAST Tap here to return to FAST", "Tap here to return to FAST",
    "CNA Games", "Guess Word", "Buzzword", "Mini Sudoku", "Mini Crossword", "Word Search", "Fetching more news", "Official Domain|Terms & Conditions|Privacy Policy|Report Vulnerability|Online Links Policy"
  ]);
  if (exact.has(compact)) return true;

  return [
    /^\*\s*(Sign In|Account|My Feed|CNA|Lifestyle|Luxury|TODAY|Search|All|Top Stories|Latest News|Asia|East Asia|Singapore|World|Commentary|CNA Explains|Sustainability|Business|Sport|Insider|Watch|Listen|Live TV|News Reports|Documentaries & Shows|TV Schedule|Podcasts|Radio Schedule|Special Reports|Games|More|Newsletters|Weather|Advertise With Us|Contact Us)\b/i,
    /Id \d+\s+Type\s+(landing_page|external)/i,
    /^#{2,6}\s*(CNAR|Search|Trending Topics|Follow CNA|Recent Searches|CNA Sections|About CNA|Also worth reading|Partner Recommendations|Related Topics|Sign up for our newsletters|Get the CNA app|Week in Review|Morning Brief)\b/i,
    /^(Homepage link|Published:)/i,
    /^(Subscribe to|Our chief editor shares|An automated curation|Stay updated with notifications|Join our channel)/i,
    /^(CNA ExplainsChina|Chinaartificial intelligenceIndonesia|Malaysia|podcasts|WellnessThailandJapan)/i,
    /^This browser is no longer supported$/i,
    /^We know it's a hassle to switch browsers/i,
    /^To continue, upgrade to a supported browser/i,
    /^Upgraded but still having issues\?/i,
    /^Copyright©/i,
    /^Mediacorp Pte Ltd/i,
    /^Add CNA as a trusted source/i,
    /^Expand to read the full story/i,
    /^Get WhatsApp alerts/i,
    /^Image \d+:/i,
    /^✓$/,
    /^%20AppleWebKit/i
  ].some(rx => rx.test(compact));
}

function isStopHeading(line = "") {
  const l = line.trim();
  return [
    /^Newsletter$/i,
    /^##\s*Week in Review/i,
    /^##\s*Morning Brief/i,
    /^##\s*Sign up for our newsletters/i,
    /^##\s*Get the CNA app/i,
    /^Get WhatsApp alerts/i,
    /^####\s*Related Topics/i,
    /^##\s*Also worth reading/i,
    /^Partner Recommendations/i,
    /^Advertisement$/i,
    /^Expand to read the full story/i,
    /^Fetching more news/i,
    /^CNA Sections/i,
    /^About CNA/i,
    /^Copyright©/i,
    /^This browser is no longer supported/i
  ].some(rx => rx.test(l));
}

function deterministicStrictClean(text = "", mode = "loose") {
  let cleaned = stripMarkdownNoise(text);
  let lines = cleaned.split("\n").map(x => x.trim()).filter(Boolean);

  // If Jina/reader output includes repeated site navigation before the real article,
  // start from the last H1 article headline. This keeps the article title, standfirst,
  // date, caption and body, while removing menus above it.
  if (mode === "strict") {
    const h1Indexes = [];
    lines.forEach((line, i) => {
      if (/^#\s+/.test(line) && !/\s-\s(CNA|BBC|Reuters|AP|AFP|The Straits Times)$/i.test(line)) h1Indexes.push(i);
    });
    if (h1Indexes.length) lines = lines.slice(h1Indexes[h1Indexes.length - 1]);
  }

  const out = [];
  let afterSource = false;
  for (const line of lines) {
    if (afterSource) break;
    if (isStopHeading(line)) {
      if (mode === "strict") break;
      continue;
    }
    if (isJunkLine(line)) continue;
    if (/^#+\s*$/.test(line)) continue;
    if (/^\*\s*$/.test(line)) continue;
    if (/^\s*[\*-]\s*\[[xX ]\]\s*.*$/.test(line)) continue;
    if (/Submenu/i.test(line)) continue;
    if (/^(Sign in|Newsletter)$/i.test(line.trim())) continue;

    // Remove long recommendation/tracking URLs and image-only fragments.
    if (/^https?:\/\//i.test(line) && line.length > 120) continue;
    if (/boost-recommend|outbrain|obOrigUrl|publisher_name|appgallery|play\.google|itunes\.apple/i.test(line)) continue;

    out.push(line);
    if (/^Source:\s*/i.test(line)) afterSource = true;
  }

  cleaned = out.join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\bAdvertisement\b\n?/gi, "")
    .replace(/\bADVERTISEMENT\b\n?/g, "")
    .trim();

  return cleaned || text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY is not set in environment variables." });

  const { mode = "loose", content = "" } = req.body || {};
  if (!content.trim()) return res.status(400).json({ error: "No article content provided." });

  const deterministicCleanedInput = deterministicStrictClean(content, mode);

  const removableItems = `
Advertisements and ad placeholders
Sponsored content and partner recommendations
Related articles, also-worth-reading sections and read-more sections
Subscription prompts and newsletter sign-up blocks
Social media share buttons and follow-us blocks
Navigation menus, edition menus, search menus and footer text
Navigation trees, category hierarchies, submenus, checklist items ([x],[ ]), sign-in blocks, newsletter blocks
FAST/cards app prompts and mobile-app prompts
Games widgets and recommendation widgets
Copyright, terms, privacy and browser-warning text
Repeated duplicated article/menu content
Image galleries and image-only lines
Long tracking URLs and recommendation URLs
`;

  const looseInstruction = `
LESS STRICT MODE — NEWSPAPER CLIPPING MODE:
Your task is to clean an article, not summarise it.

DO NOT:
- Summarise
- Rewrite
- Paraphrase
- Shorten
- Condense
- Merge paragraphs
- Remove quotes
- Remove examples
- Remove anecdotes
- Remove statistics
- Remove background information
- Remove historical context

KEEP:
- All article paragraphs
- All quotations
- All statistics
- All examples
- All interviews
- All case studies
- All background sections
- All context explaining the story

ONLY REMOVE:
- Advertisements
- Newsletter sign-up prompts
- Subscription prompts
- Related article links
- Navigation menus
- Social media prompts
- Video prompts
- Copyright notices
- Duplicate photo captions
- Repeated boilerplate text
- Read more sections
- Recommended for you sections

Return the article with original paragraph structure preserved.
The output should normally retain 95-100% of the article.
If unsure, KEEP the text.
`;

  const strictInstruction = `
STRICT MODE:
Be firm with website junk. Remove repeated navigation/menu/search/share/footer/newsletter/games/recommendation/FAST/app/download/browser-warning blocks.
For CNA-style pages, keep the real article section only: headline, standfirst, useful caption/date, body paragraphs, and source line.
Still KEEP all article body paragraphs, quotes, statistics, prices, examples, names, dates, locations, policy details, background information and human-interest details.
Do not summarise, rewrite, condense or paraphrase.
If unsure whether a paragraph is article content, KEEP it.
`;

  const instruction = mode === "strict" ? strictInstruction : looseInstruction;

  const prompt = `
You are cleaning extracted news article text for a permanent news archive.

Return ONLY valid JSON:
{
  "cleanedArticle": "cleaned article text"
}

Remove ONLY these types of non-news content:
${removableItems}

${instruction}

Important:
- The input may already have been pre-cleaned by rules. Continue cleaning only if obvious junk remains.
- Keep article wording and paragraph order unchanged.
- Do not add comments or explanations.

Article text:\n${deterministicCleanedInput.slice(0, 12000)}
`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.app",
        "X-Title": "News Article Compiler Cleaner"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });

    const data = await response.json();
    clearTimeout(timeout);
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "OpenRouter request failed." });

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch { return res.status(200).json({ cleanedArticle: deterministicCleanedInput, warning: "AI returned invalid JSON, so rule-based strict cleaning was used." }); }

    const aiCleaned = parsed.cleanedArticle || deterministicCleanedInput;
    const finalCleaned = deterministicStrictClean(aiCleaned, mode);
    const originalLength = content.trim().length;
    const precleanLength = deterministicCleanedInput.trim().length;
    const finalLength = finalCleaned.trim().length;
    const minimumRatio = mode === "strict" ? 0.45 : 0.80;

    // Compare against the rule-cleaned input, not the raw extraction, because raw pages can contain huge menus.
    if (precleanLength > 2000 && finalLength < precleanLength * minimumRatio) {
      return res.status(200).json({
        cleanedArticle: deterministicCleanedInput,
        warning: `AI cleaning removed too much article content, so the fuller rule-based cleaned article was used instead. Raw length: ${originalLength}, pre-cleaned length: ${precleanLength}, AI length: ${finalLength}.`
      });
    }

    return res.status(200).json({ cleanedArticle: finalCleaned });

  } catch (err) {
    return res.status(200).json({ cleanedArticle: deterministicCleanedInput, warning: err.message || "AI cleaning failed, so rule-based strict cleaning was used." });
  }
}
