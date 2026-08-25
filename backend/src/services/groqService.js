/**
 * Narrative forecasting service.
 * If GROQ_API_KEY is set, asks Groq's LLM to turn historical AQI stats into a
 * plain-language 12-month health-risk forecast. If no key is set yet, falls
 * back to a deterministic rule-based narrative generator so the feature works
 * end-to-end today — swap in the key later and nothing else has to change.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildPrompt(district, stats) {
  return `You are an environmental health analyst for Punjab, Pakistan.
Given this historical AQI summary for ${district}, write a concise 12-month
outlook (150-200 words) covering: (1) expected seasonal pollution peaks
(e.g. winter smog Nov-Feb), (2) overall trend direction vs last year,
(3) the health groups most at risk (children, elderly, asthma/pregnancy),
and (4) two concrete precautionary actions for residents.
End with one line labelled "RISK_LEVEL:" followed by exactly one of:
low, moderate, high, severe.

Historical stats (JSON): ${JSON.stringify(stats)}`;
}

function fallbackNarrative(district, stats) {
  const { avgAqi, maxAqi, winterAvg, summerAvg, trendPctVsLastYear } = stats;

  let riskLevel = "moderate";
  if (avgAqi >= 200) riskLevel = "severe";
  else if (avgAqi >= 150) riskLevel = "high";
  else if (avgAqi < 100) riskLevel = "low";

  const trendText =
    trendPctVsLastYear > 5
      ? `worsening by roughly ${trendPctVsLastYear}% compared to last year`
      : trendPctVsLastYear < -5
      ? `improving by roughly ${Math.abs(trendPctVsLastYear)}% compared to last year`
      : "holding roughly steady compared to last year";

  const narrative = `Over the next 12 months, ${district} is projected to average an AQI of about ${avgAqi}, ${trendText}. The sharpest spike is expected between November and February, historically peaking near AQI ${maxAqi} as crop residue burning, low wind speeds, and vehicle/industrial emissions combine into seasonal smog — winter averages (~${winterAvg}) run well above summer averages (~${summerAvg}). Children, elderly residents, pregnant women, and anyone with asthma or other respiratory conditions face the highest risk during these peak weeks, with elevated risk of aggravated symptoms, hospital visits, and reduced lung function over repeated exposure. Residents in these groups should limit prolonged outdoor activity on high-AQI days and keep rescue medication accessible, while everyone should keep windows closed and consider masks (N95) during smog spikes. Real-time monitoring through this dashboard, cross-referenced with the Punjab EPA feed, will refine these estimates as more live sensor and vehicle-emission data comes in.
RISK_LEVEL: ${riskLevel}`;

  return { narrative, riskLevel };
}

function parseRiskLevel(text) {
  const match = text.match(/RISK_LEVEL:\s*(low|moderate|high|severe)/i);
  return match ? match[1].toLowerCase() : "moderate";
}

async function generateForecast(district, stats) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const { narrative, riskLevel } = fallbackNarrative(district, stats);
    return { narrative, riskLevel, generatedBy: "fallback", fallbackReason: "GROQ_API_KEY not set in backend/.env" };
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        messages: [{ role: "user", content: buildPrompt(district, stats) }],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Groq API error ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response from Groq");

    return { narrative: text, riskLevel: parseRiskLevel(text), generatedBy: "groq" };
  } catch (err) {
    console.error("Groq forecast failed, using fallback:", err.message);
    const { narrative, riskLevel } = fallbackNarrative(district, stats);
    return { narrative, riskLevel, generatedBy: "fallback", fallbackReason: err.message };
  }
}

module.exports = { generateForecast };
