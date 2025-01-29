// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const Result = () => {
//   const [correctCount, setCorrectCount] = useState(0);
//   const [totalCorrectCount, setTotalCorrectCount] = useState(0); // 累計正解数の状態
//   const [currentTitle, setCurrentTitle] = useState(""); // 現在の称号
//   const [newTitle, setNewTitle] = useState(""); // 更新された称号
//   const [showPopup, setShowPopup] = useState(false); // ポップアップの表示状態
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchAnswers = async () => {
//       try {
//         const token = localStorage.getItem("access_token");
//         const response = await axios.post("http://localhost:8000/update_answer", {}, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
  
//         console.log("API Response:", response.data); // デバッグ用
//         setCorrectCount(response.data.correct_count);
//         setTotalCorrectCount(response.data.updated_answer_count);
  
//         // 称号が変わった場合にポップアップを表示
//         if (response.data.updated_title && response.data.updated_title !== currentTitle) {
//           setNewTitle(response.data.updated_title);
//           setShowPopup(true);
//           setCurrentTitle(response.data.updated_title);
//         }
//       } catch (error) {
//         console.error("Error fetching answers:", error);
//       }
//     };
  
//     fetchAnswers();
//   }, []); // 依存配列を空にする
  


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

//       {/* ポップアップモーダル */}
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
//     fontFamily: "Arial, sans-serif",
//     padding: "50px",
//     maxWidth: "700px",
//     border: "1px solid #ccc",
//     borderRadius: "12px",
//     backgroundColor: "#F9F9F9",
//     margin: "0 auto",
//     textAlign: "center",
//     boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
//   },
//   header: {
//     fontSize: "32px",
//     color: "#2E8B57",
//     marginBottom: "20px",
//   },
//   resultBox: {
//     margin: "30px 0",
//     backgroundColor: "#FFA500",
//     padding: "30px",
//     borderRadius: "10px",
//     color: "#fff",
//     fontSize: "20px",
//   },
//   congratulations: {
//     fontSize: "20px",
//     color: "#4CAF50",
//     marginTop: "20px",
//   },
//   homeButton: {
//     marginTop: "40px",
//     backgroundColor: "#28a745",
//     color: "#fff",
//     border: "none",
//     padding: "15px 30px",
//     borderRadius: "8px",
//     cursor: "pointer",
//     fontSize: "18px",
//     boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
//     transition: "transform 0.2s",
//   },
//   popupOverlay: {
//     position: "fixed",
//     top: 0,
//     left: 0,
//     width: "100%",
//     height: "100%",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   popupContent: {
//     backgroundColor: "#fff",
//     padding: "30px",
//     borderRadius: "10px",
//     textAlign: "center",
//     boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
//     maxWidth: "400px",
//     width: "80%",
//   },
//   closeButton: {
//     marginTop: "20px",
//     backgroundColor: "#28a745",
//     color: "#fff",
//     border: "none",
//     padding: "10px 20px",
//     borderRadius: "8px",
//     cursor: "pointer",
//     fontSize: "16px",
//   },
// };

// export default Result;


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
    fontFamily: "Arial, sans-serif",
    padding: "50px",
    maxWidth: "700px",
    border: "1px solid #ccc",
    borderRadius: "12px",
    backgroundColor: "#F9F9F9",
    margin: "0 auto",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },
  header: {
    fontSize: "32px",
    color: "#2E8B57",
    marginBottom: "20px",
  },
  resultBox: {
    margin: "30px 0",
    backgroundColor: "#FFA500",
    padding: "30px",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "20px",
  },
  congratulations: {
    fontSize: "20px",
    color: "#4CAF50",
    marginTop: "20px",
  },
  homeButton: {
    marginTop: "40px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "15px 30px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "18px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    transition: "transform 0.2s",
  },
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContent: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
    maxWidth: "400px",
    width: "80%",
  },
  closeButton: {
    marginTop: "20px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default Result;

