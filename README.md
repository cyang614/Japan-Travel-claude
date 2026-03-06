# 🗾 日本旅行 AI 助理

一個串接 Claude API 的日本旅遊規劃網頁，支援 AI 行程規劃、景點介紹、多輪問答。

## 🔒 安全架構

```
使用者瀏覽器 → /api/chat（Vercel 後端）→ Anthropic API
```

API Key 只存在 Vercel 環境變數，**不會出現在任何程式碼或 GitHub 上**。

---

## 🚀 部署步驟

### 第一步：上傳到 GitHub

1. 在 GitHub 建立一個新的 Repository（點右上角 `+` → `New repository`）
2. 在你的電腦開啟終端機，進入這個資料夾：
   ```bash
   cd japan-travel
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/你的帳號/你的repo名稱.git
   git push -u origin main
   ```

### 第二步：連接 Vercel

1. 前往 [vercel.com](https://vercel.com) 並用 GitHub 帳號登入
2. 點 **Add New Project**
3. 選擇你剛剛建立的 GitHub Repository
4. Framework 選 **Vite**
5. 點 **Deploy**（先不要填 API Key，之後再加）

### 第三步：設定 API Key（最重要！）

1. 部署完成後，進入你的 Vercel 專案
2. 點上方 **Settings** → 左側 **Environment Variables**
3. 新增一個變數：
   - **Name**：`ANTHROPIC_API_KEY`
   - **Value**：`sk-ant-api03-你的金鑰`
4. 點 **Save**
5. 回到 **Deployments** → 點最新的部署 → **Redeploy**

### 完成！

你的網站現在可以在 `https://你的專案名稱.vercel.app` 訪問，API Key 完全安全 🎉

---

## 📁 專案結構

```
japan-travel/
├── api/
│   └── chat.js        ← 後端：API Key 藏在這裡（Vercel 伺服器執行）
├── src/
│   ├── App.jsx        ← 前端主元件
│   └── main.jsx       ← React 入口點
├── index.html
├── vite.config.js
├── package.json
└── .gitignore         ← 確保 .env 不會上傳到 GitHub
```
