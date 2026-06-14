export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY is not set in environment variables." });

  const { mode = "loose", content = "" } = req.body || {};
  if (!content.trim()) return res.status(400).json({ error: "No article content provided." });

  const removeList = `
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

  const strictInstruction = mode === "strict"
    ? `STRICT MODE:
Remove the listed non-news content firmly when it is reasonably identifiable.
Still keep the actual news article body, factual background, quotes, statistics, names, dates, locations, explanations, and policy details.
Do not summarize or paraphrase.`
    : `LESS STRICT MODE:
Remove only obvious instances of the listed non-news content.
If unsure whether a paragraph is part of the article or not, keep it.
Do not summarize or paraphrase.`;

  const prompt = `
You are cleaning extracted news article text.

Return ONLY valid JSON:
{
  "cleanedArticle": "cleaned article text"
}

Remove ONLY these types of non-news content:
${removeList}

${strictInstruction}

Rules:
- Keep all actual article paragraphs.
- Keep background information.
- Keep quotes.
- Keep statistics.
- Keep dates, names, organisations and locations.
- Keep policy details.
- Keep all economic information.
- Do not rewrite the article.
- Do not shorten the article into a summary.
- Do not add new content.
- Output the original article text minus only the removable non-news content.

Article text:
${content.slice(0, 18000)}
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

    return res.status(200).json({ cleanedArticle: parsed.cleanedArticle || content });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
}
