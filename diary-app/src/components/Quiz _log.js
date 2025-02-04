// 
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const QuizHistoryPage = () => {
  const [quizData, setQuizData] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQuiz, setTotalQuiz] = useState(0);
  const [percent, setPercent] = useState(0);
  const [openSetIndex, setOpenSetIndex] = useState(null);
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem("authToken") || null);

  const fetchQuizData = async () => {
    try {
      // クイズ履歴の取得
      const response = await axios.get("http://localhost:8000/get_answer_quiz", {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });
      const formattedData = response.data.correct_count
        .map((set) => Object.values(set)[0])
        .sort((a, b) => new Date(b.answer_date) - new Date(a.answer_date));

      setQuizData(formattedData);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    }
  };

  const fetchTotalAnswerData = async () => {
    try {
      // 正解数や総問題数の取得
      const response = await axios.get("http://localhost:8000/get_total_answer", {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });
      setCorrectCount(response.data.correct_count);
      setTotalQuiz(response.data.total_quiz);
      setPercent(response.data.persent);
    } catch (error) {
      console.error("Error fetching total answer data:", error);
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/startpage");
        return;
      }
      tokenRef.current = token;
      try {
        const response = await axios.post(
          "http://localhost:8000/verify_token",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.valid) {
          fetchQuizData();
          fetchTotalAnswerData(); // クイズ統計データを取得
        } else {
          navigate("/startpage");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        navigate("/startpage");
      }
    };
    verifyToken();
  }, []);
  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>My Quiz History</h2>

      {/* Quiz Stats */}
      <div
        style={{
          textAlign: "center",
          padding: "10px",  // Reduced padding for smaller bar
          backgroundColor: "#ffffff",  // White background color
          borderRadius: "15px",
          marginBottom: "15px",
          fontSize: "16px",  // Smaller font size
          fontWeight: "bold",
          display: "flex",  // Flexbox for horizontal layout
          justifyContent: "space-around",  // Space between the items
        }}
      >
        <div>
          <strong style={{ color: "#28a745", fontSize: "20px" }}>Correct Count:</strong>
          <span style={{ color: "#28a745", fontWeight: "bold", fontSize: "24px" }}>
            {correctCount}
          </span>
        </div>
        <div>
          <strong style={{ color: "#28a745", fontSize: "20px" }}>Correct Rate:</strong>
          <span style={{ color: "#28a745", fontWeight: "bold", fontSize: "24px" }}>
            {percent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Back Button */}
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
        ◀️Back
      </button>

      {/* Quiz History */}
      {quizData.length === 0 ? (
        <p style={{ textAlign: "center", color: "#777", fontSize: "16px", marginTop: "20px" }}>
          No quiz...😢
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px", marginTop: "30px" }}>
          {quizData.map((set, index) => (
            <div key={index} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#ffcc30", // 薄いオレンジ
                  border: "1px solid #ffb74d", // より薄いオレンジ
                  borderRadius: "15px",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                  cursor: "pointer",
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#000",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative"
                }}
                onClick={() => setOpenSetIndex(openSetIndex === index ? null : index)}
              >

                <span style={{ fontSize: "14px", color: "#555" }}>{set.answer_date}</span>
                <span
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "25px",
                    fontWeight: "bold",
                    display: "flex",
                    flexDirection: "column", // 縦方向に配置
                    alignItems: "center", // 中央揃え
                  }}
                >
                  {set.title}
                  <span style={{ fontSize: "16px", color: "#333", fontWeight: "normal" }}>
                    ユーザ：{set.name}
                  </span>
                </span>


                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: "10px", fontSize: "20px", fontWeight: "bold", color: "black", }}>{set.correct_set}/5</span>
                  <span
                    style={{
                      fontSize: "20px",
                      color: "black",
                      cursor: "pointer",
                    }}
                  >
                    {openSetIndex === index ? "▲" : "▼"}
                  </span>
                </div>
              </div>
              {openSetIndex === index && (
                <div
                  style={{
                    marginTop: "15px",
                    padding: "15px",  // Reduced padding for quiz details
                    backgroundColor: "#f7f7f7",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    fontSize: "16px",  // Smaller font size for quiz details
                  }}
                >
                  {set.questions.map((quiz) => (
                    <div
                      key={quiz.quiz_id}
                      style={{
                        padding: "12px",  // Reduced padding
                        borderBottom: "1px solid #ddd",
                        marginBottom: "12px",  // Reduced margin
                        backgroundColor: quiz.judgement === 1 ? "#d4edda" : "#f8d7da",
                      }}
                    >
                      <p><strong>Q{quiz.quiz_id} : </strong> {quiz.question}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default QuizHistoryPage;