
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Result = () => {
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCorrectCount, setTotalCorrectCount] = useState(0); // 累計正解数の状態
  const [currentTitle, setCurrentTitle] = useState(""); // 現在の称号
  const [newTitle, setNewTitle] = useState(""); // 更新された称号
  const [showPopup, setShowPopup] = useState(false); // ポップアップの表示状態
  const navigate = useNavigate();

  useEffect(() => {
    const createAnswerSet = async () => {
      try {
        const token = localStorage.getItem("access_token");
        
        // /create_answer_set APIを呼び出す
        await axios.post("http://localhost:8000/create_answer_set", {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // 次に/update_answer APIを呼び出して、結果を更新
        const response = await axios.post("http://localhost:8000/update_answer", {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // APIのレスポンスを使って状態を更新
        setCorrectCount(response.data.correct_count);
        setTotalCorrectCount(response.data.updated_answer_count);
        
        // 称号が変わった場合にポップアップを表示
        if (response.data.updated_title && response.data.updated_title !== currentTitle) {
          setNewTitle(response.data.updated_title);
          setShowPopup(true);
          setCurrentTitle(response.data.updated_title);
        }
      } catch (error) {
        console.error("Error during API calls:", error);
      }
    };

    createAnswerSet();
  }, [currentTitle]); // 依存配列に currentTitle を加え、称号が変わった場合に再実行

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>結果発表</h1>
      <div style={styles.resultBox}>
        <h2>今回の結果: {correctCount} / 5</h2>
        <h3>累計正解数: {totalCorrectCount}</h3>
      </div>
      <p style={styles.congratulations}>おつかれさまでした！</p>
      <button style={styles.homeButton} onClick={() => navigate("/Chat")}>
        チャット画面に戻る
      </button>

      {/* ポップアップモーダル */}
      {showPopup && (
        <div style={styles.popupOverlay} onClick={() => setShowPopup(false)}>
          <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
            <h2>おめでとうございます！</h2>
            <p>新しい称号を獲得しました: <strong>{newTitle}</strong></p>
            <button style={styles.closeButton} onClick={() => setShowPopup(false)}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
const styles = {
  container: {
    background: "linear-gradient(135deg, #FFA500, #4CAF50)",
    color: "#fff",
    padding: "40px",
    width: "600px",
    margin: "50px auto",
    borderRadius: "15px",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
    textAlign: "center",
  },
  input: {
    width: "90%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    margin: "10px 0",
  },
  select: {
    width: "90%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    margin: "10px 0",
  },
  displayOnly: {
    width: "100%", // 100%に変更して中央に寄せる
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    margin: "10px 0",
    backgroundColor: "#eee",
    color: "#333",
    textAlign: "center", // 中央寄せ
  },
  button: {
    padding: "12px 24px",
    backgroundColor: "#FFA500",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    margin: "10px 5px",
    transition: "all 0.3s ease",
  },
};
export default Result;