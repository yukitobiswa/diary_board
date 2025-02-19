import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { API_BASE_URL } from '../config';
const Result = () => {
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCorrectCount, setTotalCorrectCount] = useState(0);
  const [currentTitle, setCurrentTitle] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isTitleUpdated, setIsTitleUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // 最初に一度だけ結果を取得する
  const fetchResults = async () => {
    try {
      console.log("結果を取得中...");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("ログイン情報がありません。再度ログインしてください。");
      }
      console.log("アクセストークン:", token);

      // ローカルストレージに結果が保存されているか確認
      const savedResults = localStorage.getItem("quiz_results");
      if (savedResults) {
        console.log("ローカルストレージから結果が取得されました:", savedResults);
        const parsedResults = JSON.parse(savedResults);
        setCorrectCount(parsedResults.correct_count);
        setTotalCorrectCount(parsedResults.updated_answer_count);
        setCurrentTitle(parsedResults.updated_title);
        setIsTitleUpdated(parsedResults.is_title_updated);
        setNewTitle(parsedResults.updated_title);
        return; // 結果が保存されている場合、API呼び出しをスキップ
      }

      console.log("ローカルストレージに結果がないためAPIを呼び出します");

      // ローカルストレージに結果がない場合はAPIから取得
      const response = await axios.post(`${API_BASE_URL}/update_answer`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("APIレスポンス:", response.data);

      // 取得した結果をstateにセット
      const resultsData = {
        correct_count: response.data.correct_count,
        updated_answer_count: response.data.updated_answer_count,
        updated_title: response.data.updated_title,
        is_title_updated: response.data.is_title_updated,
      };

      setCorrectCount(resultsData.correct_count);
      setTotalCorrectCount(resultsData.updated_answer_count);
      setCurrentTitle(resultsData.updated_title);
      setIsTitleUpdated(resultsData.is_title_updated);

      // タイトルが更新されていればポップアップを表示
      if (resultsData.is_title_updated) {
        setNewTitle(resultsData.updated_title);
        setShowPopup(true);
      }

      // 結果をローカルストレージに保存
      localStorage.setItem("quiz_results", JSON.stringify(resultsData));
    } catch (error) {
      console.error("API呼び出しエラー:", error);
      setErrorMessage(error.response?.data?.detail || "結果の取得中にエラーが発生しました。");
    }
  };

  // 結果をAPIに送信して保存する
  const createAnswerSet = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("ログイン情報がありません。再度ログインしてください。");
      }

      // ローカルストレージから結果を取得
      const savedResults = localStorage.getItem("quiz_results");
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        const { correct_count, updated_answer_count, updated_title, is_title_updated } = parsedResults;

        const response = await axios.post(
          `${API_BASE_URL}/create_answer_set`, 
          { 
            correct_count, 
            updated_answer_count, 
            updated_title, 
            is_title_updated 
          }, 
          { 
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Answer Set Created:", response.data);
      }
    } catch (error) {
      console.error("Answer Set作成エラー:", error);
      setErrorMessage("Answer Setの作成中にエラーが発生しました。");
    }
  };

  useEffect(() => {
    console.log("useEffectが呼ばれました");
    fetchResults(); // 最初のレンダリング時にfetchResultsを呼び出す
    
    // クリーンアップ: ページを閉じるときにローカルストレージからデータを削除
    return () => {
      console.log("コンポーネントがアンマウントされました。結果を削除します。");
      try {
        localStorage.removeItem("quiz_results"); // ローカルストレージから結果を削除
        console.log("ローカルストレージのデータが削除されました");
      } catch (error) {
        console.error("ローカルストレージの削除に失敗しました:", error);
      }
    };
  }, []); // 依存配列が空なので、コンポーネントがマウントされたときに一度だけ呼ばれます
  
  useEffect(() => {
    // create_answer_set API呼び出しを行う
    createAnswerSet();
  }, [correctCount]); // correctCountが更新されたタイミングで呼び出し

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Results Announcement 🎉</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <div style={styles.resultBox}>
        <h2>This Round's Results : {correctCount} / 5</h2>
        <h3>Total Correct Answers : {totalCorrectCount}</h3>
        <h3>Current Nickname: <span style={styles.title}>{currentTitle}</span></h3>
      </div>
      <p style={styles.congratulations}>Thanks for playing!👏</p>
      <button style={styles.button} onClick={() => navigate("/Chat")}>
        Go to Homepage 🏠
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
