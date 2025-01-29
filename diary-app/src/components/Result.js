// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const Result = () => {
//   const [correctCount, setCorrectCount] = useState(0);
//   const [totalCorrectCount, setTotalCorrectCount] = useState(0);
//   const [currentTitle, setCurrentTitle] = useState("");
//   const [newTitle, setNewTitle] = useState("");
//   const [showPopup, setShowPopup] = useState(false);
//   const navigate = useNavigate();
//   const hasFetched = useRef(false); // 初回実行を防ぐ

//   const fetchResults = async () => {
//     try {
//       const token = localStorage.getItem("access_token");

//       // 1. /create_answer_set を呼び出し（回答セットを作成）
//       await axios.post("http://localhost:8000/create_answer_set", {}, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       // 2. /update_answer を呼び出し（スコアや称号を更新）
//       const response = await axios.post("http://localhost:8000/update_answer", {}, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setCorrectCount(response.data.correct_count);
//       setTotalCorrectCount(response.data.updated_answer_count);

//       // 新しい称号が付与された場合、ポップアップを表示
//       if (response.data.updated_title && response.data.updated_title !== currentTitle) {
//         setNewTitle(response.data.updated_title);
//         setShowPopup(true);
//         setCurrentTitle(response.data.updated_title);
//       }
//     } catch (error) {
//       console.error("API呼び出し中のエラー:", error);
//     }
//   };

//   useEffect(() => {
//     if (!hasFetched.current) {
//       hasFetched.current = true; // 一度だけ実行
//       fetchResults();
//     }
//   }, []);

//   return (
//     <div style={styles.container}>
//       <h1 style={styles.header}>結果発表</h1>
//       <div style={styles.resultBox}>
//         <h2>今回の結果: {correctCount} / 5</h2>
//         <h3>累計正解数: {totalCorrectCount}</h3>
//       </div>
//       <p style={styles.congratulations}>おつかれさまでした！</p>
//       <button style={styles.homeButton} onClick={() => navigate("/Chat")}>
//         チャット画面に戻る
//       </button>

//       {showPopup && (
//         <div style={styles.popupOverlay} onClick={() => setShowPopup(false)}>
//           <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
//             <h2>おめでとうございます！</h2>
//             <p>新しい称号を獲得しました: <strong>{newTitle}</strong></p>
//             <button style={styles.closeButton} onClick={() => setShowPopup(false)}>
//               閉じる
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const styles = {
//   container: {
//     background: "linear-gradient(135deg, #FFA500, #4CAF50)",
//     color: "#fff",
//     padding: "40px",
//     width: "600px",
//     margin: "50px auto",
//     borderRadius: "15px",
//     boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
//     textAlign: "center",
//   },
//   button: {
//     padding: "12px 24px",
//     backgroundColor: "#FFA500",
//     color: "#fff",
//     border: "none",
//     borderRadius: "8px",
//     cursor: "pointer",
//     margin: "10px 5px",
//     transition: "all 0.3s ease",
//   },
// };

// export default Result;
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Result = () => {
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCorrectCount, setTotalCorrectCount] = useState(0);
  const [currentTitle, setCurrentTitle] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isTitleUpdated, setIsTitleUpdated] = useState(false); // 称号が更新されたか
  const navigate = useNavigate();
  const hasFetched = useRef(false); // 初回実行を防ぐ

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem("access_token");

      // 1. /create_answer_set を呼び出し（回答セットを作成）
      await axios.post("http://localhost:8000/create_answer_set", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2. /update_answer を呼び出し（スコアや称号を更新）
      const response = await axios.post("http://localhost:8000/update_answer", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCorrectCount(response.data.correct_count);
      setTotalCorrectCount(response.data.updated_answer_count);
      setCurrentTitle(response.data.updated_title);
      setIsTitleUpdated(response.data.is_title_updated);

      // 称号が更新された場合のみポップアップを表示
      if (response.data.is_title_updated) {
        setNewTitle(response.data.updated_title);
        setShowPopup(true);
      }
    } catch (error) {
      console.error("API呼び出し中のエラー:", error);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true; // 一度だけ実行
      fetchResults();
    }
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>結果発表</h1>
      <div style={styles.resultBox}>
        <h2>今回の結果: {correctCount} / 5</h2>
        <h3>累計正解数: {totalCorrectCount}</h3>
        <h3>現在の称号: {currentTitle}</h3>
      </div>
      <p style={styles.congratulations}>おつかれさまでした！</p>
      <button style={styles.homeButton} onClick={() => navigate("/Chat")}>
        チャット画面に戻る
      </button>

      {showPopup && isTitleUpdated && (
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
