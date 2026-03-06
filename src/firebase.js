// ============================================================
// 🔥 Firebase 設定檔
//
// 使用前需要：
//   1. 去 https://console.firebase.google.com 建立專案
//   2. 新增 Web App，複製 firebaseConfig 的值填入下方
//   3. 啟用 Firestore Database（選 test mode 即可）
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

// 🔧 把這裡換成你自己的 Firebase 設定
// Firebase Console → 你的專案 → 專案設定 → 你的應用程式 → firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyBUMlWZ0tKBTcanXSQ3arzdHnvVsSdkG5w",
  authDomain: "japan-trave-claude.firebaseapp.com",
  projectId: "japan-trave-claude",
  storageBucket: "japan-trave-claude.firebasestorage.app",
  messagingSenderId: "317878794588",
  appId: "1:317878794588:web:a5e82e959954ddab4a2999"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firestore 資料庫
export const db = getFirestore(app);

// ============================================================
// 🪪 裝置 ID：用來識別「是你自己」，不需要登入帳號
// 第一次造訪時自動產生，存在瀏覽器的 localStorage
// 只要不清除瀏覽器資料，下次來還是同一個 ID
// ============================================================
export function getDeviceId() {
  let id = localStorage.getItem("japan_travel_device_id");
  if (!id) {
    // 產生一個隨機 ID，例如 "user_a3f9b2c1"
    id = "user_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("japan_travel_device_id", id);
  }
  return id;
}

// ============================================================
// 💾 儲存行程到 Firestore
// ============================================================
export async function savePlan({ days, style, cities, budget, planText }) {
  const deviceId = getDeviceId();
  await addDoc(collection(db, "plans"), {
    deviceId,                    // 誰存的（你的裝置 ID）
    days, style, cities, budget, // 規劃條件
    planText,                    // Claude 生成的行程內容
    createdAt: serverTimestamp(), // 儲存時間（Firebase 伺服器時間）
  });
}

// ============================================================
// 💬 儲存對話紀錄到 Firestore
// ============================================================
export async function saveChat(messages) {
  const deviceId = getDeviceId();
  await addDoc(collection(db, "chats"), {
    deviceId,
    messages,                    // 完整對話陣列 [{role, content}, ...]
    createdAt: serverTimestamp(),
  });
}

// ============================================================
// 📖 讀取你自己的行程紀錄
// ============================================================
export async function loadMyPlans() {
  const deviceId = getDeviceId();
  // 查詢 plans 集合中，deviceId 等於你的 ID 的文件，按時間倒序
  const q = query(
    collection(db, "plans"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  // 過濾出屬於你的紀錄（簡單版：在前端過濾）
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(doc => doc.deviceId === deviceId);
}

// ============================================================
// 📖 讀取你自己的對話紀錄
// ============================================================
export async function loadMyChats() {
  const deviceId = getDeviceId();
  const q = query(
    collection(db, "chats"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(doc => doc.deviceId === deviceId);
}
