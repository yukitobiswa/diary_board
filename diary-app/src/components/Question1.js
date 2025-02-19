import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from '../config';
const Question1 = () => {
  const { diaryId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectAnswer, setSelectAnswer] = useState(null);
  const [isAlreadyAnswered, setIsAlreadyAnswered] = useState(null);
  const navigate = useNavigate();
  const isFetched = useRef(false); // 二重実行を防ぐフラグ

  // クイズが既に回答済みかを確認
  const alreadyQuiz = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE_URL}/already_quiz/${diaryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.already;
    } catch (err) {
      console.error("ERROR", err);
      return false; // エラー時に false を返す
    }
  };

  // クイズを取得
  const fetchQuiz = async () => {
    if (isFetched.current) return; // 既に実行済みならスキップ
    isFetched.current = true;

    if (isAlreadyAnswered !== null) return; // すでにチェック済みなら再実行しない

    try {
      const already = await alreadyQuiz();
      setIsAlreadyAnswered(already);

      if (already) {
        alert("This quiz is already answered. : このクイズは既に回答済みです。");
        navigate("/Chat");
        return;
      }

      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE_URL}/get_same_quiz/${diaryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const quizzes = response.data.quizzes;
      if (quizzes?.length > 0) {
        const minQuiz = quizzes.reduce((prev, curr) =>
          prev.quiz_id < curr.quiz_id ? prev : curr
        );
        setQuiz(minQuiz);
      } else {
        console.error("No quizzes found. : クイズが見つかりませんでした。");
      }
    } catch (err) {
      console.error("ERROR : クイズ取得エラー", err);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [diaryId]);

  const handleOptionChange = (key) => {
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
      await axios.post(`${API_BASE_URL}/create_answer`, answerData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch (err) {
      console.error("ERROR : クイズ送信エラー", err);
      return false;
    }
  };

  const handleSubmit = async () => {
    const success = await submitAnswer();
    if (success) {
      navigate(`/Answer1/${quiz.diary_id}`, { state: { selectedOption } });
    } else {
      alert("Please select an answer. : 答えを選択してください。");
    }
  };

  if (!quiz) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h3>Q1 <u>{quiz.question}</u></h3>
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
};

export default Question1;