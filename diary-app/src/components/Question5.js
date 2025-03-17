import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Confetti from "react-confetti";

const Question5 = () => {
  const { diaryId } = useParams();
  const [quiz, setQuiz] = useState();
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectAnswer, setSelectAnswer] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const navigate = useNavigate();

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE_URL}/get_same_quiz/${diaryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("クイズ取得レスポンス:", response.data);

      const quizzes = response.data.quizzes;
      if (quizzes && quizzes.length > 4) {
        const sortedQuizzes = quizzes.sort((a, b) => a.quiz_id - b.quiz_id);
        console.log("選ばれたクイズ:", sortedQuizzes[4]);
        setQuiz(sortedQuizzes[4]);
      } else {
        console.error("クイズが5問以上存在しません");
      }
    } catch (err) {
      console.error("クイズ取得エラー:", err);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [diaryId]);

  const handleOptionChange = (key) => {
    console.log(`選択された選択肢: ${key}`);
    setSelectedOption(key);
    setSelectAnswer(key);
  };

  const submitAnswer = async () => {
    if (selectAnswer == null) {
      alert("Please select an answer. : 答えを選択してください。");
      return false;
    }
  
    const token = localStorage.getItem("access_token");
    const answerData = {
      quiz_id: quiz.quiz_id,
      diary_id: quiz.diary_id,
      choices: selectAnswer,
    };
  
    try {
      const response = await axios.post(`${API_BASE_URL}/create_answer`, answerData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("クイズ回答レスポンス:", response.data);
  
      if (response.data.is_title_updated) {
        setNewTitle(response.data.updated_title);
        setShowPopup(true);  // ✅ showPopupを即座にtrueにする
        console.log("✅ showPopupの状態 (setShowPopupの後):", true);
        console.log("ポップアップが表示されるはずです");
      } else {
        console.log("❌ 称号更新はありませんでした");
      }
  
      return true;
    } catch (err) {
      console.error("ERROR:", err);
      return false;
    }
  };
  
  useEffect(() => {
    if (showPopup) {
      console.log("🌟 showPopup 状態が true になりました。ポップアップを表示します。");
    }
  }, [showPopup]);
  
  const handleSubmit = async () => {
    const success = await submitAnswer();
    if (success) {
      console.log("✅ クイズ回答が成功しました");
      setTimeout(() => {
        navigate(`/Answer5/${quiz.diary_id}`, { state: { selectedOption } });
      }, 5000);  // ✅ ポップアップが出るので3秒遅延が適切
    } else {
      console.log("❌ クイズ回答が失敗しました");
      alert("Please select an answer. : 答えを選択してください。");
    }
  };
  

  useEffect(() => {
    console.log("🌟 showPopup 状態の変更が検出されました →", showPopup);
  }, [showPopup]);

  if (!quiz) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h3>Q5 <u>{quiz.question}</u></h3>
      <div style={styles.options}>
        {Object.entries(quiz.choices).map(([key, option], index) => (
          <div key={index} style={styles.option}>
            <input
              type="radio"
              id={`option-${index}`}
              name="quiz"
              value={option}
              onChange={() => handleOptionChange(key)}
            />
            <label htmlFor={`option-${index}`} style={styles.label}>
              {key.toUpperCase()}. {option}
            </label>
          </div>
        ))}
      </div>
      <button onClick={handleSubmit} style={styles.submitButton}>
        Answer✅
      </button>

      {showPopup && (
        <>
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            numberOfPieces={400}
            recycle={false}
          />
          <div style={styles.popupOverlay} onClick={() => setShowPopup(false)}>
            <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.celebrationText}>🎉 おめでとうございます！ 🎉</h2>
              <p style={styles.newTitleText}>
                <span role="img" aria-label="star">⭐</span>
                新しい称号を獲得しました！  
                <strong style={styles.newTitle}>{newTitle}</strong>
                <span role="img" aria-label="star">⭐</span>  
              </p>
              <button style={styles.submitButton} onClick={() => setShowPopup(false)}>
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
    fontFamily: "Arial, sans-serif",
    padding: "100px",
    maxWidth: "1000px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    backgroundColor: "#F9F9F9",
    margin: "0 auto",
  },
  options: {
    marginTop: "20px",
  },
  option: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
  },
  label: {
    marginLeft: "10px",
    flexGrow: 1,
    color: "#333",
  },
  submitButton: {
    marginTop: "30px",
    backgroundColor: "#FFA500",
    color: "#fff",
    border: "none",
    padding: "15px 30px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s",
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
    zIndex: 1001,
  },
};
export default Question5;