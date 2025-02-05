import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const User_inf = () => {
  const [messages, setMessages] = useState([]);
  const [diaryCount, setDiaryCount] = useState(0);
  const [openDiaryId, setOpenDiaryId] = useState(null);
  const [isDiaryView, setIsDiaryView] = useState(true); // State to toggle between diary and quiz
  const [quizData, setQuizData] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQuiz, setTotalQuiz] = useState(0);
  const [percent, setPercent] = useState(0);
  const [openSetIndex, setOpenSetIndex] = useState(null);

  const dictionary = {
    1: "a",
    2: "b",
    3: "c",
    4: "d"
  };

  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem("authToken") || null);
  const { user_id } = useParams();

  const fetchDiaries = async () => {
    if (!tokenRef.current || !user_id) return;

    try {
      const response = await axios.post(
        "http://localhost:8000/get_individual_diaries",
        { user_id: user_id },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "application/json",
          },
        }
      );
      const diaryData = response.data.diaries;
      setDiaryCount(response.data.diary_count);

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
          }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error fetching diaries:", error);
    }
  };

  const fetchQuizData = async () => {
    if (!tokenRef.current || !user_id) return;
    try {
      const response = await axios.post("http://localhost:8000/get_individual_quiz", {
        user_id: user_id,
      },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "application/json",
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
    if (!tokenRef.current || !user_id) return;
    try {
      // 正解数や総問題数の取得
      const response = await axios.post("http://localhost:8000/get_individual_answer", {
        user_id: user_id,
      },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "application/json",
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
          // ここで関数呼び出し
          fetchDiaries();
          fetchQuizData();
          fetchTotalAnswerData();
        } else {
          navigate("/startpage");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        navigate("/startpage");
      }
    };
    verifyToken();
  }, [navigate]);


  const toggleDiary = (diaryId) => {
    setOpenDiaryId(openDiaryId === diaryId ? null : diaryId);
  };

  const toggleQuiz = (index) => {
    setOpenSetIndex(openSetIndex === index ? null : index);
  };

  const deleteDiary = async (diaryId) => {
    if (!tokenRef.current) return;
    const confirmDelete = window.confirm("本当にこの日記を削除しますか？");
    if (!confirmDelete) return;

    try {
      const response = await axios.put(
        `http://localhost:8000/delete_diary/${diaryId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );

      if (response.data.message === "Diary Deleted Successfully!") {
        setMessages(messages.filter((message) => message.diary_id !== diaryId));
        setDiaryCount((prevCount) => prevCount - 1);
        fetchDiaries();
      }
    } catch (error) {
      console.error("Error deleting diary:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>User History</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setIsDiaryView(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: isDiaryView ? "#4caf50" : "#ddd",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Diary✉️
        </button>
        <button
          onClick={() => setIsDiaryView(false)}
          style={{
            padding: "10px 20px",
            backgroundColor: !isDiaryView ? "#4caf50" : "#ddd",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Quiz✅
        </button>
      </div>

      {isDiaryView ? (
        <>
          <h3 style={{ textAlign: "center",  color: "#28a745", fontSize: "20px" }}>
            Diary: {diaryCount}
          </h3>
          <button
            onClick={() => navigate("/Teacher_page")}
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
            ◀ Back
          </button>
          {messages.length === 0 ? (
            <p style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
              No diary...😢
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
              {messages.map((message) => (
                <div key={message.diary_id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div
                    style={{
                      padding: "15px",
                      backgroundColor: "#ffa500",
                      border: "1px solid #ffa500",
                      borderRadius: "10px",
                      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                      cursor: "pointer",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "#000",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      position: "relative",
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
                        fontSize: "25px",
                        fontWeight: "bold",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {message.title}
                      <span style={{ fontSize: "16px", color: "#333", fontWeight: "normal" }}>
                        User：{message.user_name}
                      </span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDiary(message.diary_id);
                        }}
                        style={{
                          fontSize: "20px",
                          cursor: "pointer",
                          padding: "5px",
                          border: "2px solid white",
                          borderRadius: "4px",
                          backgroundColor: "white",
                        }}
                      >
                        🚮
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
                      <p><strong>Content:</strong> {message.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
          <div
            style={{
              textAlign: "center",
              padding: "10px",
              backgroundColor: "#ffffff",
              borderRadius: "15px",
              marginBottom: "15px",
              fontSize: "16px",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-around",
            }}
          >
            <div>
              <strong style={{ color: "#28a745", fontSize: "20px" }}>Correct Count:</strong>
              <span style={{ color: "#28a745", fontWeight: "bold", fontSize: "24px" }}>
                {correctCount}
              </span>
            </div>
            <div>
              <strong style={{ color: "#28a745", fontSize: "20px" }}>Total count:</strong>
              <span style={{ color: "#28a745", fontWeight: "bold", fontSize: "24px" }}>
                {totalQuiz}
              </span>
            </div>
            <div>
              <strong style={{ color: "#28a745", fontSize: "20px" }}>Correct Rate:</strong>
              <span style={{ color: "#28a745", fontWeight: "bold", fontSize: "24px" }}>
                {percent}%
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/Teacher_page")}
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
            ◀️ Back
          </button>
          {quizData.length === 0 ? (
            <p style={{ textAlign: "center", color: "#777", fontSize: "16px", marginTop: "20px" }}>
              No Quiz...😢
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px", marginTop: "30px" }}>
              {quizData.map((set, index) => (
                <div key={index} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div
                    style={{
                      padding: "20px",
                      backgroundColor: "#ffa500",
                      border: "1px solid #ffa500",
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
                    onClick={() => toggleQuiz(index)}
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
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {set.title}
                      <span style={{ fontSize: "16px", color: "#333", fontWeight: "normal" }}>
                        User：{set.name}
                      </span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ marginRight: "10px", fontSize: "20px", fontWeight: "bold", color: "black" }}>{set.correct_set}/5</span>
                      <span style={{ fontSize: "20px", color: "black", cursor: "pointer" }}>
                        {openSetIndex === index ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                  {openSetIndex === index && (
                    <div
                      style={{
                        marginTop: "15px",
                        padding: "15px",
                        backgroundColor: "#f7f7f7",
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        fontSize: "16px",
                      }}
                    >
                      {set.questions.map((quiz) => (
                        <div
                          key={quiz.quiz_id}
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid gray",
                            marginBottom: "12px",
                            backgroundColor: "white",

                          }}
                        >
                          <p><strong>Q{quiz.quiz_id} :</strong> {quiz.question}</p>
                          <div style={{ marginTop: "10px" }}>
                            {Object.entries(quiz.choices).map(([key, value]) => {
                              const isCorrect = key === dictionary[quiz.choices.correct];
                              const isSelected = key === quiz.choice;

                              let backgroundColor = "";
                              if (isSelected && isCorrect) {
                                backgroundColor = "lightgreen"; // Correct answer and selected
                              } else if (isSelected && !isCorrect) {
                                backgroundColor = "lightcoral"; // Incorrect answer but selected
                              } else if (isCorrect) {
                                backgroundColor = "lightgreen"; // Correct answer but not selected
                              }

                              return (
                                <p key={key} style={{ margin: "5px 0", backgroundColor }}>
                                  {key !== "correct" && (
                                    <>
                                      <strong>{key}:</strong> {value}
                                    </>
                                  )}
                                </p>
                              );
                            })}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default User_inf;
