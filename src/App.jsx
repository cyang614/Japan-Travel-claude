import { useState, useRef, useEffect } from "react";

// ============================================================
// 🗺️ 日本旅遊 AI 規劃師
// ✅ 安全版本：API Key 不在這裡，在後端 api/chat.js
// ✅ 費用控制：每個 IP 每天限制 15 次，token 上限 400
// ============================================================

const SPOTS = [
  { id: 1, name: "淺草寺", city: "東京", emoji: "⛩️", tag: "文化" },
  { id: 2, name: "伏見稻荷大社", city: "京都", emoji: "🦊", tag: "神社" },
  { id: 3, name: "道頓堀", city: "大阪", emoji: "🦞", tag: "美食" },
  { id: 4, name: "金閣寺", city: "京都", emoji: "✨", tag: "文化" },
  { id: 5, name: "東京鐵塔", city: "東京", emoji: "🗼", tag: "地標" },
  { id: 6, name: "奈良公園", city: "奈良", emoji: "🦌", tag: "自然" },
];

const WEATHER = {
  東京: { temp: 18, icon: "⛅", desc: "多雲時晴" },
  京都: { temp: 16, icon: "🌸", desc: "晴朗" },
  大阪: { temp: 19, icon: "☀️", desc: "晴天" },
  奈良: { temp: 15, icon: "🌤️", desc: "局部多雲" },
};

// ============================================================
// 🤖 呼叫後端
// 前端 → /api/chat（Vercel 後端）→ Anthropic
// onRemainingUpdate：後端回傳剩餘次數時的 callback
// ============================================================
async function callClaude(messages, systemPrompt, onRemainingUpdate) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,  // 後端會強制覆蓋成 400，前端這裡寫多少都沒差
      system: systemPrompt,
      messages: messages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API 呼叫失敗");
  }

  // 如果後端回傳剩餘次數，更新顯示
  if (data.remainingRequests !== undefined && onRemainingUpdate) {
    onRemainingUpdate(data.remainingRequests);
  }

  return data.content[0].text;
}

// ============================================================
// 🏠 主元件
// ============================================================
export default function App() {
  const [activeTab, setActiveTab] = useState("planner");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [spotInfo, setSpotInfo] = useState("");
  const [spotLoading, setSpotLoading] = useState(false);
  // 剩餘使用次數（15 = 還沒用過）
  const [remaining, setRemaining] = useState(15);

  const handleSpotClick = async (spot) => {
    setSelectedSpot(spot);
    setSpotInfo("");
    setSpotLoading(true);
    try {
      const messages = [{ role: "user", content: `請用繁體中文介紹「${spot.name}」，包含歷史背景、最佳參觀時間、實用建議，約150字。` }];
      const result = await callClaude(messages, "你是專業的日本旅遊達人，回答簡潔有趣。", setRemaining);
      setSpotInfo(result);
    } catch (err) {
      setSpotInfo(`❌ ${err.message}`);
    } finally {
      setSpotLoading(false);
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.logo}>🗾 日本旅行 AI 助理</span>
          <div style={styles.headerRight}>
            {/* 剩餘次數指示器 */}
            <div style={{
              ...styles.remainingBadge,
              background: remaining <= 3 ? "rgba(220,60,40,0.15)" : "rgba(232,197,71,0.12)",
              borderColor: remaining <= 3 ? "#dc3c28" : "#e8c547",
              color: remaining <= 3 ? "#dc3c28" : "#e8c547",
            }}>
              {remaining <= 0 ? "⛔ 今日次數已用完" : `✨ 今日剩餘 ${remaining} 次`}
            </div>
            <nav style={styles.nav}>
              {["planner", "spots", "chat"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ ...styles.navBtn, ...(activeTab === tab ? styles.navBtnActive : {}) }}>
                  {tab === "planner" && "🗓️ 行程規劃"}
                  {tab === "spots" && "📍 景點探索"}
                  {tab === "chat" && "💬 AI 問答"}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === "planner" && <PlannerTab onRemainingUpdate={setRemaining} />}
        {activeTab === "spots" && (
          <SpotsTab spots={SPOTS} weather={WEATHER} selectedSpot={selectedSpot}
            spotInfo={spotInfo} spotLoading={spotLoading} onSpotClick={handleSpotClick} />
        )}
        {activeTab === "chat" && <ChatTab onRemainingUpdate={setRemaining} />}
      </main>
    </div>
  );
}

// ============================================================
// 🗓️ 行程規劃頁面
// ============================================================
function PlannerTab({ onRemainingUpdate }) {
  const [form, setForm] = useState({ days: "5", style: "文化歷史", cities: "東京、京都", budget: "中等" });
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true); setPlan("");
    try {
      const messages = [{ role: "user", content: `規劃日本旅遊行程：${form.days}天、${form.style}風格、城市：${form.cities}、預算：${form.budget}。請按天列出早中晚安排。` }];
      const result = await callClaude(messages, "你是頂尖的日本旅遊規劃師，請用繁體中文回覆，格式清晰。", onRemainingUpdate);
      setPlan(result);
    } catch (err) { setPlan(`❌ ${err.message}`); }
    finally { setLoading(false); }
  };

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.sectionTitle}>🗓️ AI 行程規劃師</h2>
      <p style={styles.subtitle}>填寫旅遊偏好，Claude 幫你量身打造專屬行程</p>
      <div style={styles.formCard}>
        <div style={styles.formGrid}>
          {[
            { label: "旅遊天數", emoji: "📅", key: "days", type: "select", options: ["3","5","7","10"].map(d => ({ value: d, label: d+"天" })) },
            { label: "旅遊風格", emoji: "🎭", key: "style", type: "select", options: ["文化歷史","美食探索","自然風景","購物娛樂","混合型"].map(s => ({ value: s, label: s })) },
            { label: "想去城市", emoji: "🏙️", key: "cities", type: "input" },
            { label: "預算規模", emoji: "💴", key: "budget", type: "select", options: ["節省","中等","舒適","奢華"].map(b => ({ value: b, label: b })) },
          ].map(f => (
            <div key={f.key} style={styles.formField}>
              <label style={styles.label}>{f.emoji} {f.label}</label>
              {f.type === "select" ? (
                <select value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} style={styles.select}>
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} style={styles.input} />
              )}
            </div>
          ))}
        </div>
        <button onClick={handleGenerate} disabled={loading} style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? "⏳ Claude 正在規劃中..." : "✨ 讓 AI 幫我規劃行程"}
        </button>
      </div>
      {plan && (
        <div style={styles.resultCard}>
          <h3 style={styles.resultTitle}>📋 你的專屬行程</h3>
          <pre style={styles.planText}>{plan}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 📍 景點探索頁面
// ============================================================
function SpotsTab({ spots, weather, selectedSpot, spotInfo, spotLoading, onSpotClick }) {
  const cities = [...new Set(spots.map(s => s.city))];
  return (
    <div style={styles.tabContent}>
      <h2 style={styles.sectionTitle}>📍 景點探索</h2>
      <p style={styles.subtitle}>點擊景點，Claude 即時生成詳細介紹</p>
      <div style={styles.weatherRow}>
        {cities.map(city => (
          <div key={city} style={styles.weatherCard}>
            <span style={styles.weatherIcon}>{weather[city]?.icon}</span>
            <div>
              <div style={styles.weatherCity}>{city}</div>
              <div style={styles.weatherTemp}>{weather[city]?.temp}°C</div>
              <div style={styles.weatherDesc}>{weather[city]?.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={styles.spotsLayout}>
        <div style={styles.spotsList}>
          {spots.map(spot => (
            <button key={spot.id} onClick={() => onSpotClick(spot)}
              style={{ ...styles.spotCard, ...(selectedSpot?.id === spot.id ? styles.spotCardActive : {}) }}>
              <span style={styles.spotEmoji}>{spot.emoji}</span>
              <div style={styles.spotInfo}>
                <div style={styles.spotName}>{spot.name}</div>
                <div style={styles.spotMeta}>{spot.city} · {spot.tag}</div>
              </div>
              <span style={styles.spotArrow}>→</span>
            </button>
          ))}
        </div>
        <div style={styles.spotDetail}>
          {!selectedSpot ? (
            <div style={styles.spotPlaceholder}><div style={{fontSize:"3rem",marginBottom:"1rem"}}>👆</div><div>點擊左側景點，AI 幫你生成介紹</div></div>
          ) : (
            <div>
              <h3 style={styles.spotDetailTitle}>{selectedSpot.emoji} {selectedSpot.name}</h3>
              <div style={styles.spotDetailMeta}>📍 {selectedSpot.city} · 🏷️ {selectedSpot.tag}</div>
              {spotLoading ? (
                <div style={styles.loadingBox}>⏳ Claude 正在撰寫介紹...</div>
              ) : (
                <p style={styles.spotDetailText}>{spotInfo}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 💬 AI 問答頁面（多輪對話）
// ============================================================
function ChatTab({ onRemainingUpdate }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "你好！我是你的日本旅遊 AI 助理 🗾 有任何關於日本旅遊的問題都可以問我！" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const apiMessages = newMessages
        .filter((m, i) => m.role === "user" || i > 0)
        .map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(apiMessages, "你是專業的日本旅遊達人，請用繁體中文回答，語氣親切有趣。", onRemainingUpdate);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: `❌ ${err.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.sectionTitle}>💬 AI 旅遊問答</h2>
      <p style={styles.subtitle}>問任何關於日本旅遊的問題，支援多輪對話</p>
      <div style={styles.chatContainer}>
        <div style={styles.chatMessages}>
          {messages.map((msg, i) => (
            <div key={i} style={{ ...styles.msgBubble, ...(msg.role === "user" ? styles.msgUser : styles.msgAssistant) }}>
              {msg.role === "assistant" && <span style={styles.msgAvatar}>🤖</span>}
              <div style={styles.msgText}>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.msgBubble, ...styles.msgAssistant }}>
              <span style={styles.msgAvatar}>🤖</span>
              <div style={styles.msgText}>⏳ 思考中...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={styles.chatInput}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="問問看：東京要怎麼買交通票？" style={styles.chatInputField} disabled={loading} />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}>
            發送 ↑
          </button>
        </div>
        <div style={styles.quickQuestions}>
          {["🚄 東京到京都怎麼去？", "🍣 必吃的日本美食？", "🙏 日本禮儀注意事項？"].map(q => (
            <button key={q} onClick={() => setInput(q.slice(2))} style={styles.quickBtn}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const C = { bg:"#0a0a0f", surface:"#12121a", card:"#1a1a26", border:"#2a2a3d", accent:"#e8c547", accentDim:"rgba(232,197,71,0.15)", text:"#f0ece0", textDim:"#8a8599" };
const styles = {
  app:{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Noto Sans TC','Hiragino Sans',sans-serif" },
  header:{ background:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:100 },
  headerContent:{ maxWidth:960, margin:"0 auto", padding:"0.75rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" },
  logo:{ fontSize:"1.1rem", fontWeight:700 },
  headerRight:{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" },
  remainingBadge:{ fontSize:"0.78rem", fontWeight:700, padding:"0.3rem 0.75rem", borderRadius:20, border:"1px solid", letterSpacing:"0.02em" },
  nav:{ display:"flex", gap:"0.5rem" },
  navBtn:{ background:"transparent", border:`1px solid ${C.border}`, color:C.textDim, padding:"0.4rem 0.9rem", borderRadius:8, cursor:"pointer", fontSize:"0.85rem" },
  navBtnActive:{ background:C.accentDim, borderColor:C.accent, color:C.accent },
  main:{ maxWidth:960, margin:"0 auto", padding:"2rem 1.5rem" },
  tabContent:{},
  sectionTitle:{ fontSize:"1.6rem", fontWeight:700, margin:"0 0 0.3rem" },
  subtitle:{ color:C.textDim, marginBottom:"1.5rem", fontSize:"0.9rem" },
  formCard:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"1.5rem", marginBottom:"1.5rem" },
  formGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"1rem", marginBottom:"1.25rem" },
  formField:{ display:"flex", flexDirection:"column", gap:"0.4rem" },
  label:{ fontSize:"0.82rem", color:C.textDim, fontWeight:600 },
  select:{ background:C.surface, border:`1px solid ${C.border}`, color:C.text, padding:"0.6rem 0.8rem", borderRadius:8, fontSize:"0.9rem", outline:"none" },
  input:{ background:C.surface, border:`1px solid ${C.border}`, color:C.text, padding:"0.6rem 0.8rem", borderRadius:8, fontSize:"0.9rem", outline:"none" },
  primaryBtn:{ width:"100%", background:C.accent, color:"#0a0a0f", border:"none", padding:"0.85rem", borderRadius:10, fontSize:"1rem", fontWeight:700, cursor:"pointer" },
  resultCard:{ background:C.card, border:`1px solid ${C.accent}`, borderRadius:16, padding:"1.5rem" },
  resultTitle:{ margin:"0 0 1rem", color:C.accent },
  planText:{ whiteSpace:"pre-wrap", lineHeight:1.8, fontSize:"0.9rem", fontFamily:"inherit", margin:0 },
  weatherRow:{ display:"flex", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap" },
  weatherCard:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"0.75rem 1rem", display:"flex", alignItems:"center", gap:"0.75rem", flex:"1 1 120px" },
  weatherIcon:{ fontSize:"1.8rem" },
  weatherCity:{ fontWeight:700, fontSize:"0.9rem" },
  weatherTemp:{ fontSize:"1.1rem", fontWeight:800, color:C.accent },
  weatherDesc:{ fontSize:"0.75rem", color:C.textDim },
  spotsLayout:{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:"1rem" },
  spotsList:{ display:"flex", flexDirection:"column", gap:"0.5rem" },
  spotCard:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"0.8rem 1rem", display:"flex", alignItems:"center", gap:"0.75rem", cursor:"pointer", textAlign:"left", color:C.text },
  spotCardActive:{ borderColor:C.accent, background:C.accentDim },
  spotEmoji:{ fontSize:"1.6rem" },
  spotInfo:{ flex:1 },
  spotName:{ fontWeight:700, fontSize:"0.95rem" },
  spotMeta:{ fontSize:"0.75rem", color:C.textDim, marginTop:2 },
  spotArrow:{ color:C.textDim },
  spotDetail:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"1.25rem", minHeight:300 },
  spotPlaceholder:{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:C.textDim, textAlign:"center", padding:"2rem" },
  spotDetailTitle:{ fontSize:"1.3rem", fontWeight:700, margin:"0 0 0.5rem" },
  spotDetailMeta:{ fontSize:"0.82rem", color:C.textDim, marginBottom:"1rem" },
  spotDetailText:{ lineHeight:1.8, fontSize:"0.9rem" },
  loadingBox:{ color:C.textDim, padding:"1rem 0" },
  chatContainer:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden", display:"flex", flexDirection:"column" },
  chatMessages:{ flex:1, padding:"1.25rem", display:"flex", flexDirection:"column", gap:"1rem", maxHeight:420, overflowY:"auto" },
  msgBubble:{ display:"flex", gap:"0.6rem", alignItems:"flex-start" },
  msgAvatar:{ fontSize:"1.2rem", flexShrink:0, marginTop:2 },
  msgText:{ background:C.surface, border:`1px solid ${C.border}`, padding:"0.7rem 1rem", borderRadius:12, lineHeight:1.7, fontSize:"0.9rem", maxWidth:"80%", whiteSpace:"pre-wrap" },
  msgUser:{ flexDirection:"row-reverse" },
  msgAssistant:{ flexDirection:"row" },
  chatInput:{ display:"flex", gap:"0.5rem", padding:"1rem", borderTop:`1px solid ${C.border}` },
  chatInputField:{ flex:1, background:C.surface, border:`1px solid ${C.border}`, color:C.text, padding:"0.7rem 1rem", borderRadius:10, fontSize:"0.9rem", outline:"none" },
  sendBtn:{ background:C.accent, color:"#0a0a0f", border:"none", padding:"0.7rem 1.2rem", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:"0.9rem" },
  quickQuestions:{ display:"flex", gap:"0.5rem", padding:"0.75rem 1rem", borderTop:`1px solid ${C.border}`, flexWrap:"wrap" },
  quickBtn:{ background:"transparent", border:`1px solid ${C.border}`, color:C.textDim, padding:"0.35rem 0.75rem", borderRadius:20, cursor:"pointer", fontSize:"0.8rem" },
};
