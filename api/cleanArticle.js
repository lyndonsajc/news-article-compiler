export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY is not set in environment variables." });

  const { mode = "loose", content = "" } = req.body || {};
  if (!content.trim()) return res.status(400).json({ error: "No article content provided." });

  const removableItems = `
Advertisements
Sponsored content
Related articles
Read more sections
Subscription prompts
Newsletter prompts
Social media links
Navigation menus
Footer text
Copyright text
Repeated content
Image galleries
Video descriptions
`;

  const looseInstruction = `
LESS STRICT MODE:
Your job is NOT to summarise, select, rewrite, condense, or extract the article.
Your job is to return the SAME article, in the SAME order, with only exact obvious junk blocks removed.

Remove only blocks/lines that are clearly:
- advertisement labels or ad placeholders
- subscription prompts
- newsletter prompts
- social media/share/navigation/footer/copyright text
- related article/read more blocks
- repeated duplicate text
- image gallery or video description blocks

KEEP EVERYTHING ELSE.

Very important:
- Keep every paragraph that contains a person, organisation, place, date, price, cost, statistic, quotation, example, explanation, background information, or policy detail.
- Keep captions if they identify useful article context or information.
- Keep article paragraphs even if they are not economics-related.
- Keep paragraphs about interviewees, small examples, human-interest details, and background context.
- If unsure, KEEP the text.
- Do not remove a paragraph just because it is short.
- Do not remove a paragraph just because it appears after an image marker.
- Do not remove continuation paragraphs.
- Do not rewrite the article.
- Do not merge paragraphs.
- Do not change wording.
- Do not shorten sentences.
`;

  const strictInstruction = `
STRICT MODE:
Return the same article text in the same order, but remove the listed non-news blocks more firmly when clearly identifiable.

Still KEEP:
- all article body paragraphs
- quotes
- statistics
- prices and costs
- examples
- names
- dates
- locations
- policy details
- background information
- human-interest details that are part of the article

Do not summarise, rewrite, condense or paraphrase.
If unsure, keep the text.
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

Additional preservation rule:
The cleanedArticle should normally be almost as long as the original article. If large parts of the article would be removed, that is probably wrong. Preserve the original article content unless the text is clearly one of the removable non-news items.

Article text:
${content.slice(0, 22000)}
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.app",
        "X-Title": "News Article Compiler Cleaner"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "OpenRouter request failed." });

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch { return res.status(500).json({ error: "AI returned invalid JSON.", raw: text }); }

    const cleaned = parsed.cleanedArticle || content;
    const originalLength = content.trim().length;
    const cleanedLength = cleaned.trim().length;
    const minimumRatio = mode === "strict" ? 0.55 : 0.75;

    if (originalLength > 2000 && cleanedLength < originalLength * minimumRatio) {
      return res.status(200).json({
        cleanedArticle: content,
        warning: `AI cleaning removed too much content, so raw article was preserved instead. Original length: ${originalLength}, cleaned length: ${cleanedLength}.`
      });
    }

    return res.status(200).json({ cleanedArticle: cleaned });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
}
