export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY is not set in environment variables." });

  const { url = "", title = "", source = "", publicationDate = "", content = "" } = req.body || {};
  if (!content.trim()) return res.status(400).json({ error: "No article content provided." });

  const prompt = `
You are helping a Singapore A-Level Economics teacher compile news articles for classroom teaching and revision.

Return ONLY valid JSON. Do not use markdown.

Use this exact structure:
{
  "title": "article title",
  "source": "news source",
  "publicationDate": "YYYY-MM-DD if available, otherwise empty string",
  "summary": "5-8 clear bullet points. Each bullet should be concise and useful for students.",
  "keywords": ["general news keyword1","general news keyword2","general news keyword3","general news keyword4","general news keyword5","general news keyword6","general news keyword7","general news keyword8"],
  "economicKeywords": ["economic term1","economic term2","economic term3","economic term4","economic term5","economic term6","economic term7","economic term8"]
}

Important:
- publicationDate must be the article's actual publication date, not today's date.
- If no publication date is available, return an empty string.
- keywords should be general search keywords.
- economicKeywords must be economics concepts/terms relevant to the article.
- Use Singapore A-Level Economics terminology where relevant.
- Include terms like PED, PES, XED, YED, market failure, externality, fiscal policy, monetary policy, inflation, unemployment, trade, protectionism, exchange rate, economic growth, inequality, competition, consumer welfare if relevant.

Provided title: ${title}
Provided source: ${source}
Provided publication date: ${publicationDate}
Article URL: ${url}

Article text:
${content.slice(0, 14000)}
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vercel.app",
        "X-Title": "News Article Compiler"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "OpenRouter request failed." });

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch { return res.status(500).json({ error: "AI returned invalid JSON.", raw: text }); }

    return res.status(200).json({
      title: parsed.title || title,
      source: parsed.source || source,
      publicationDate: parsed.publicationDate || publicationDate || "",
      summary: parsed.summary || "",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      economicKeywords: Array.isArray(parsed.economicKeywords) ? parsed.economicKeywords : []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error." });
  }
}
