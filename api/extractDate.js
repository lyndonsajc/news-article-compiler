function normaliseDate(value = "") {
  const text = String(value).trim();
  const iso = text.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const months = { jan:"01",january:"01",feb:"02",february:"02",mar:"03",march:"03",apr:"04",april:"04",may:"05",jun:"06",june:"06",jul:"07",july:"07",aug:"08",august:"08",sep:"09",sept:"09",september:"09",oct:"10",october:"10",nov:"11",november:"11",dec:"12",december:"12" };
  let m = text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i);
  if (m) return `${m[3]}-${months[m[1].toLowerCase().replace(".","")]}-${String(m[2]).padStart(2,"0")}`;
  m = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?[,]?\s+(20\d{2})\b/i);
  if (m) return `${m[3]}-${months[m[2].toLowerCase().replace(".","")]}-${String(m[1]).padStart(2,"0")}`;
  return "";
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const rawUrl = String(req.query?.url || "").trim();
  if (!/^https?:\/\//i.test(rawUrl)) return res.status(400).json({ error: "Invalid URL" });

  try {
    const response = await fetch(rawUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    const html = await response.text();
    const candidates = [];

    const metaPatterns = [
      /<meta[^>]+(?:property|name)=["'](?:article:published_time|og:published_time|publication_date|datePublished|pubdate)["'][^>]+content=["']([^"']+)["']/ig,
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:article:published_time|og:published_time|publication_date|datePublished|pubdate)["']/ig
    ];
    for (const pattern of metaPatterns) {
      let match;
      while ((match = pattern.exec(html))) candidates.push(match[1]);
    }

    const jsonLdPatterns = [
      /["']datePublished["']\s*:\s*["']([^"']+)["']/ig,
      /["']dateCreated["']\s*:\s*["']([^"']+)["']/ig
    ];
    for (const pattern of jsonLdPatterns) {
      let match;
      while ((match = pattern.exec(html))) candidates.push(match[1]);
    }

    const timePattern = /<time[^>]+datetime=["']([^"']+)["']/ig;
    let timeMatch;
    while ((timeMatch = timePattern.exec(html))) candidates.push(timeMatch[1]);

    for (const candidate of candidates) {
      const publicationDate = normaliseDate(decodeHtml(candidate));
      if (publicationDate) return res.status(200).json({ publicationDate });
    }

    const visiblePatterns = [
      /(?:Published|Publication Date)\s*(?:on\s*)?([^<\n]{0,80})/i,
      /(?:Updated)\s*(?:on\s*)?([^<\n]{0,80})/i
    ];
    for (const pattern of visiblePatterns) {
      const match = decodeHtml(html.replace(/<[^>]+>/g, " ")).match(pattern);
      const publicationDate = normaliseDate(match?.[1] || "");
      if (publicationDate) return res.status(200).json({ publicationDate });
    }

    return res.status(200).json({ publicationDate: "" });
  } catch (err) {
    return res.status(200).json({ publicationDate: "", warning: err.message || "Date lookup failed" });
  }
}
