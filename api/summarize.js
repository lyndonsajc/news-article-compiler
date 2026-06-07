export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENROUTER_API_KEY is not set in environment variables."
    });
  }

  const { url = "", title = "", source = "", publicationDate = "", content = "" } = req.body || {};

  if (!content.trim()) {
    return res.status(400).json({ error: "No article content provided." });
  }

  const prompt = `
You are helping a teacher compile news articles for classroom teaching and revision.

Return ONLY valid JSON. Do not use markdown.

Use this structure:
{
  "title": "article title",
  "source": "news source",
  "publicationDate": "YYYY-MM-DD if available, otherwise empty string",
  "summary": "5-8 clear bullet points. Each bullet should be concise and useful for students.",
  "keywords": ["keyword1","keyword2","keyword3","keyword4","keyword5","keyword6","keyword7","keyword8"]
}

Important:
- publicationDate must be the article's actual publication date, not today's date.
- If no publication date is available, return an empty string.
- Keywords should support quick search.
- Include economics topic keywords if relevant.

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

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenRouter request failed."
      });
    }

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON.",
        raw: text
      });
    }

    return res.status(200).json({
      title: parsed.title || title,
      source: parsed.source || source,
      publicationDate: parsed.publicationDate || publicationDate || "",
      summary: parsed.summary || "",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || "Server error."
    });
  }
}
