import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const HistoryPage = () => {
  const [messages, setMessages] = useState([]);
  const [openDiaryId, setOpenDiaryId] = useState(null); // 開かれた日記IDを管理
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem("authToken") || null); // トークンをlocalStorageから取得

  // 日記を取得する関数
  const fetchDiaries = async () => {
    if (!tokenRef.current) return; // トークンがセットされていない場合は処理を終了

    try {
      // 新しいエンドポイントを呼び出す
      const response = await axios.get("http://localhost:8000/get_my_diary", {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`, // トークンをヘッダーに含める
        },
      });

      // レスポンスのデータを整形してメッセージリストに格納
      const diaryData = response.data.diaries;
      if (diaryData.length === 0) {
        setMessages([]);
      } else {
        const formattedMessages = diaryData
        .sort((a, b) => new Date(b.diary_time) - new Date(a.diary_time))
        .map((diary) => ({
          user_name: diary.user_name,
          diary_id: diary.diary_id,
          title: diary.title,
          content: diary.content,
          diary_time: diary.diary_time,
          reactions: diary.reactions || {},
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error fetching diaries:", error);
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/startpage");
        return;
      }
      tokenRef.current = token; // トークンをrefに保存
      try {
        const response = await axios.post("http://localhost:8000/verify_token", {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.valid) {
          fetchDiaries(); // トークンが有効なら日記を取得
        } else {
          navigate("/startpage");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        navigate("/startpage");
      }
    };

    verifyToken(); // マウント時にトークンを確認
  }, []); // 依存関係が空のため、コンポーネントのマウント時にのみ実行

  // アコーディオンを開く関数
  const toggleDiary = (diaryId) => {
    if (openDiaryId === diaryId) {
      setOpenDiaryId(null); // 同じ日記をクリックしたら閉じる
    } else {
      setOpenDiaryId(diaryId); // 新しい日記をクリックしたら開く
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>日記履歴</h2>
      <button
        onClick={() => navigate("/Chat")}
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          backgroundColor: "#4caf50",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        戻る
      </button>
      {messages.length === 0 ? (
        <p style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
          まだ履歴がありません
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
          {messages.map((message) => (
            <div key={message.diary_id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                  cursor: "pointer",
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#007bff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onClick={() => toggleDiary(message.diary_id)}
              >
                <span style={{ fontSize: "14px", color: "#555" }}>
                  {message.diary_time}
                </span>
                <span
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "20px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {message.title}
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    color: "black",
                    cursor: "pointer",
                  }}
                >
                  {openDiaryId === message.diary_id ? "▲" : "▼"}
                </span>
              </div>
              {openDiaryId === message.diary_id && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "15px",
                    backgroundColor: "#f7f7f7",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    boxShadow: "0 2px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <p><strong>内容:</strong> {message.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
