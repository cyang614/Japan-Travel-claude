// ============================================================
// 🔒 後端 API Route - 安全 + 費用控制版本
// 包含三層保護：
//   1. IP 每日使用次數限制
//   2. max_tokens 限制（控制每次費用）
//   3. Anthropic Console 月預算（需手動設定，見 README）
// ============================================================

// 用記憶體儲存每個 IP 今天的使用次數
// 注意：Vercel 每次重新部署或冷啟動都會重置，這是免費方案的限制
const ipCounts = {};

// ============================
// ⚙️ 費用控制設定（可以自由調整）
// ============================
const CONFIG = {
  MAX_REQUESTS_PER_IP_PER_DAY: 15,  // 每個 IP 每天最多幾次
  MAX_TOKENS: 400,                    // 每次回答最多幾個 token（越少越省錢）
};

export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ============================================================
  // 🚦 第一層保護：IP 每日使用次數限制
  // ============================================================

  // 取得用戶的 IP 位址
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";

  // 用「IP + 今天日期」當作 key，這樣每天自動重置
  const today = new Date().toDateString(); // 例如 "Fri Mar 06 2026"
  const countKey = `${ip}-${today}`;

  // 累加這個 IP 今天的使用次數
  ipCounts[countKey] = (ipCounts[countKey] || 0) + 1;

  // 超過上限就拒絕請求
  if (ipCounts[countKey] > CONFIG.MAX_REQUESTS_PER_IP_PER_DAY) {
    return res.status(429).json({
      error: `今日 AI 使用次數已達上限（${CONFIG.MAX_REQUESTS_PER_IP_PER_DAY} 次），請明天再來！`
    });
  }

  // ============================================================
  // 🔑 第二層保護：從環境變數讀取 API Key
  // ============================================================
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "API Key 未設定，請在 Vercel 環境變數中加入 ANTHROPIC_API_KEY"
    });
  }

  try {
    // ============================================================
    // 💬 轉發請求給 Anthropic，並強制套用 max_tokens 上限
    // ============================================================
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        ...req.body,                    // 展開前端傳來的請求內容
        max_tokens: CONFIG.MAX_TOKENS,  // 強制覆蓋，前端無法繞過這個限制
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // 把剩餘次數也回傳給前端，讓前端可以顯示給用戶
    return res.status(200).json({
      ...data,
      remainingRequests: CONFIG.MAX_REQUESTS_PER_IP_PER_DAY - ipCounts[countKey],
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
