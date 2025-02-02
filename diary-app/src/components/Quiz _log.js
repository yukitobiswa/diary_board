import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const QuizHistoryPage = () => {
  const [quizData, setQuizData] = useState([]);
  const [openSetIndex, setOpenSetIndex] = useState(null);
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem("authToken") || null);

  const fetchQuizHistory = async () => {
    try {
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
          fetchQuizHistory();
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

  const toggleSetDetail = (index) => {
    setOpenSetIndex(openSetIndex === index ? null : index);
  };

  const getBackgroundColor = (judgement) => {
    return judgement === 1 ? "#d4edda" : judgement === 0 ? "#f8d7da" : "#ffffff";
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>クイズ履歴</h2>
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
      {quizData.length === 0 ? (
        <p style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
          まだ履歴がありません
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
          {quizData.map((set, index) => (
            <div key={index} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                  position: "relative"
                }}
                onClick={() => toggleSetDetail(index)}
              >
                <span style={{ fontSize: "14px", color: "#555" }}>{set.answer_date}</span>
                <span
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "25px",
                    fontWeight: "bold",
                  }}
                >
                  {set.title}
                </span>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: "10px", fontSize: "20px", fontWeight: "bold",color:"black",}}>{set.correct_set}/5</span>
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
                    marginTop: "10px",
                    padding: "15px",
                    backgroundColor: "#f7f7f7",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    boxShadow: "0 2px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  {set.questions.map((quiz) => (
                    <div
                      key={quiz.quiz_id}
                      style={{
                        padding: "10px",
                        borderBottom: "1px solid #ddd",
                        marginBottom: "10px",
                        backgroundColor: getBackgroundColor(quiz.judgement),
                      }}
                    >
                      <p><strong>問題 {quiz.quiz_id}:</strong> {quiz.question}</p>
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
