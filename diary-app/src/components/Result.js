import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";

const Result = () => {
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCorrectCount, setTotalCorrectCount] = useState(0);
  const [currentTitle, setCurrentTitle] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isTitleUpdated, setIsTitleUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("ログイン情報がありません。再度ログインしてください。");
      }

      await axios.post("http://localhost:8000/create_answer_set", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await axios.post("http://localhost:8000/update_answer", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCorrectCount(response.data.correct_count);
      setTotalCorrectCount(response.data.updated_answer_count);
      setCurrentTitle(response.data.updated_title);
      setIsTitleUpdated(response.data.is_title_updated);

      if (response.data.is_title_updated) {
        setNewTitle(response.data.updated_title);
        setShowPopup(true);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "結果の取得中にエラーが発生しました。");
      console.error("API呼び出しエラー:", error);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>結果発表</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <div style={styles.resultBox}>
        <h2>今回の結果: {correctCount} / 5</h2>
        <h3>累計正解数: {totalCorrectCount}</h3>
        <h3>現在の称号: <span style={styles.title}>{currentTitle}</span></h3>
      </div>
      <p style={styles.congratulations}>おつかれさまでした！</p>
      <button style={styles.button} onClick={() => navigate("/Chat")}>
        チャット画面に戻る
      </button>

      {/* 称号更新時のスペシャルエフェクト */}
      {showPopup && isTitleUpdated && (
        <>
          <Confetti /> {/* 紙吹雪エフェクト */}
          <div style={styles.popupOverlay} onClick={() => setShowPopup(false)}>
            <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.celebrationText}>🎉 おめでとうございます！ 🎉</h2>
              <p style={styles.newTitleText}>
                <span role="img" aria-label="star">⭐</span>  
                新しい称号を獲得しました！  
                <strong style={styles.newTitle}>{newTitle}</strong>
                <span role="img" aria-label="star">⭐</span>  
              </p>
              <button style={styles.button} onClick={() => setShowPopup(false)}>
                閉じる
              </button>
            </div>
          </div>
        </>
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
  title: {
    fontWeight: "bold",
    color: "#FFD700",
    fontSize: "1.5em",
  },
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  popupContent: {
    background: "#fff",
    color: "#333",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
    transform: "scale(1.1)",
    animation: "fadeIn 0.5s ease-in-out",
  },
  celebrationText: {
    fontSize: "2em",
    fontWeight: "bold",
    color: "#ff4500",
  },
  newTitleText: {
    fontSize: "1.5em",
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: "10px",
  },
  newTitle: {
    fontSize: "2em",
    color: "#FFD700",
    textShadow: "2px 2px 5px rgba(0,0,0,0.3)",
  },
};

export default Result;
