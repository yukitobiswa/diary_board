import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const Question1 = () => {
  const { diaryId } = useParams(); // URLからdiaryIdを取得
  const [quiz, setQuiz] = useState(null); // クイズデータを保存する状態
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectAnswer, setSelectAnswer] = useState(null);
  const [isAlreadyAnswered, setIsAlreadyAnswered] = useState(null); // クイズが既に回答済みかを保存
  const navigate = useNavigate();

  // クイズが既に回答済みかを確認する関数
  const alreadyQuiz = async () => {
    try {
      const token = localStorage.getItem("access_token"); // トークンを取得
      const response = await axios.get(`http://localhost:8000/already_quiz/${diaryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Already quiz response:", response.data);
      return response.data.already; // true なら既に回答済み、false なら未回答
    } catch (err) {
      console.error("既存クイズ確認エラー:", err);
      return false; // エラー時に false を返して二重 alert を防ぐ
    }
  };

  // クイズを取得する関数
  const fetchQuiz = async () => {
    if (isAlreadyAnswered !== null) return; // すでにチェック済みなら再実行しない

    try {
      const already = await alreadyQuiz();
      setIsAlreadyAnswered(already); // 状態を保存

      if (already) {
        alert("この日記のクイズは既に回答済みです。");
        navigate("/Chat");
        return;
      }

      const token = localStorage.getItem("access_token");
      const response = await axios.get(`http://localhost:8000/get_same_quiz/${diaryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(response);
      const quizzes = response.data.quizzes;
      if (quizzes && quizzes.length > 0) {
        // quiz_idが最小のクイズを取得
        const minQuiz = quizzes.reduce((prev, curr) =>
          prev.quiz_id < curr.quiz_id ? prev : curr
        );
        setQuiz(minQuiz); // 最小のクイズを設定
      } else {
        console.error("No quizzes found");
      }
    } catch (err) {
      console.error("クイズ取得エラー:", err);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [diaryId]);

  const handleOptionChange = (key) => {
    setSelectedOption(key); // 選択肢を状態にセット
    setSelectAnswer(key);
  };

  const submitAnswer = async () => {
    if (selectAnswer == null) {
      alert("答えを選択してください。");
      return false; // 選択されていない場合は false を返す
    }

    const token = localStorage.getItem("access_token");
    const answerData = {
      quiz_id: quiz.quiz_id,
      diary_id: quiz.diary_id,
      choices: selectAnswer,
    };

    console.log("送信するデータ:", answerData); // デバッグ用にデータを表示
    try {
      await axios.post("http://localhost:8000/create_answer", answerData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("答えが正常に送信されました");
      return true; // 成功した場合は true を返す
    } catch (err) {
      console.error("クイズの送信エラー:", err);
      return false; // エラーが発生した場合は false を返す
    }
  };

  const handleSubmit = async () => {
    const success = await submitAnswer();
    if (success) {
      navigate(`/Answer1/${quiz.diary_id}`, { state: { selectedOption } }); // 選択されたオプションに基づいて次の画面へ遷移
    } else {
      alert("答えを選択してください。");
    }
  };

  if (!quiz) {
    return <div>Loading...</div>; // クイズデータが取得されるまでローディング表示
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
              onChange={() => handleOptionChange(key)} // オプション変更時に状態を更新
            />
            <label htmlFor={`option-${index}`} style={styles.label}>
              {key.toUpperCase()}. {option}
            </label>
          </div>
        ))}
      </div>
      <button onClick={handleSubmit} style={styles.submitButton}>
        次へ
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
    color: "#333", // ラベルの色
  },
  submitButton: {
    marginTop: "30px",
    backgroundColor: "#4CAF50", // 緑色のボタン
    color: "#fff",
    border: "none",
    padding: "15px 30px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s", // ホバー時の変化を滑らかに
  },
};

export default Question1;
