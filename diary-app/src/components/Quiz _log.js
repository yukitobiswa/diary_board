import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Quiz_log = () => {
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
      const formattedMessages = diaryData.map((diary) => ({
        user_name: diary.user_name,
        diary_id: diary.diary_id,
        title: diary.title,
        content: diary.content,
        diary_time: diary.diary_time,
        reactions: diary.reactions || {},
      }));
      setMessages(formattedMessages);
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
  }, [fetchDiaries, navigate]);

  // アコーディオンを開く関数
  const toggleDiary = (diaryId) => {
    if (openDiaryId === diaryId) {
      setOpenDiaryId(null); // 同じ日記をクリックしたら閉じる
    } else {
      setOpenDiaryId(diaryId); // 新しい日記をクリックしたら開く
    }
  };

  // 詳細を閉じる関数
  const closeDiary = () => {
    setOpenDiaryId(null); // 詳細を閉じる
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>クイズ履歴</h2>

      {/* 戻るボタン */}
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

      {/* メッセージ履歴 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",  // 縦に並べる
          justifyContent: "center",  // 中央に配置
          alignItems: "center",  // 水平方向も中央に配置
          gap: "20px",  // 題名間の隙間
          marginTop: "30px",  // 上部の隙間
        }}
      >
        {messages.map((message) => (
          <div
            key={message.diary_id}
            style={{
              padding: "15px",
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "10px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              width: "80%",  // 横幅を80%に設定
              textAlign: "center",  // 題名を中央揃え
            }}
          >
            <h4
              style={{
                cursor: "pointer",
                color: "#007bff",
                textDecoration: "underline",
              }}
              onClick={() => toggleDiary(message.diary_id)} // アコーディオンを開閉
            >
              {message.title}
            </h4>
            {/* 題名下に日時を表示 */}
            <span
              style={{
                fontSize: "14px",
                color: "#888",
                display: "block",  // 改行して下に表示
                marginBottom: "10px",  // 日時と題名の間に隙間を入れる
              }}
            >
              {new Date(message.diary_time).toLocaleString()} {/* 日時を表示 */}
            </span>

            {/* アコーディオンで開く日記内容 */}
            {openDiaryId === message.diary_id && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "15px",
                  backgroundColor: "#f7f7f7",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxShadow: "0 2px 3px rgba(0,0,0,0.1)",
                  position: "relative",  // バツボタンのために相対位置
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#999",
                  }}
                  onClick={closeDiary} // バツボタンで詳細を閉じる
                >
                  &times;
                </div>
                <p>{message.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quiz_log;
