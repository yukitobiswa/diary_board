import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const QuizHistoryPage = () => {
  const [quizData, setQuizData] = useState([]);
  const [openSetIndex, setOpenSetIndex] = useState(null); // アコーディオンの管理
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem("authToken") || null); // トークンをlocalStorageから取得

  // クイズ履歴を取得する関数
  const fetchQuizHistory = async () => {
    try {
      const response = await axios.get("http://localhost:8000/get_answer_quiz", {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`, // トークンをヘッダーに含める
        },
      });

      // レスポンスのデータを保存
      const formattedData = response.data.correct_count.map((set) => {
        return Object.values(set)[0]; // 1セットを取得
      });

      setQuizData(formattedData);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/startpage");
        return;
      }
      tokenRef.current = token; // トークンを ref に保存
      try {
        const response = await axios.post(
          "http://localhost:8000/verify_token",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.valid) {
          fetchQuizHistory(); // トークンが有効ならクイズ履歴を取得
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

  // アコーディオンの開閉
  const toggleSetDetail = (index) => {
    setOpenSetIndex(openSetIndex === index ? null : index); // 同じセットを再度クリックで閉じる
  };

  // 問題文の背景色を変更する関数
  const getBackgroundColor = (judgement) => {
    if (judgement === 1) {
      return "#d4edda"; // 緑色の背景
    } else if (judgement === 0) {
      return "#f8d7da"; // 赤色の背景
    }
    return "#ffffff"; // デフォルトの背景色
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

      {/* クイズ履歴 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column", // 縦に並べる
          gap: "20px", // 隙間を設定
          marginTop: "30px",
        }}
      >
        {quizData.map((set, index) => (
          <div key={index} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* タイトル表示 */}
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
                textDecoration: "underline",
              }}
              onClick={() => toggleSetDetail(index)} // タイトルをクリックで詳細表示
            >
              {set.title} {/* タイトルを表示 */}
            </div>

            {/* アコーディオンで詳細を表示 */}
            {openSetIndex === index && (
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
                {/* 各問題文を順番に表示 */}
                {set.questions.map((quiz) => (
                  <div
                    key={quiz.quiz_id}
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      marginBottom: "10px",
                      backgroundColor: getBackgroundColor(quiz.judgement), // 背景色を設定
                    }}
                  >
                    <p><strong>問題 {quiz.quiz_id}:</strong> {quiz.question}</p> {/* 問題文を表示 */}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizHistoryPage;
