import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const Answer5 = () => {
  const { diaryId } = useParams(); // URLからdiaryIdを取得
  const [sameQuiz, setSameQuiz] = useState(); // get_same_quiz のデータを保存する状態
  const [differentQuiz, setDifferentQuiz] = useState(); // get_different_quiz のデータを保存する状態
  const [judgement, setJudgement] = useState(null); // 正解・不正解を保存する状態
  const [selectedChoice, setSelectedChoice] = useState(null); // ユーザーの選択を保存
  const [correctChoice, setCorrectChoice] = useState(null); // 正解の選択肢を保存
  const navigate = useNavigate();

  // クイズとジャッジメントを取得する関数
  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem("access_token"); // トークンを取得

      // get_same_quiz/{diary_id} からクイズを取得
      const sameQuizResponse = await axios.get(`http://localhost:8000/get_same_quiz/${diaryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSameQuiz(sameQuizResponse.data.quizzes[0]); // 最初のクイズを設定

      // get_different_quiz/{diary_id} からクイズを取得
      const differentQuizResponse = await axios.get(`http://localhost:8000/get_different_quiz/${diaryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDifferentQuiz(differentQuizResponse.data.quizzes[0]); // 最初のクイズを設定

      // get_judgement/{diary_id} から正解・不正解を取得
      const judgementResponse = await axios.get(`http://localhost:8000/get_judgement5/${diaryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setJudgement(judgementResponse.data.judgement); // ジャッジメントの結果を保存
      setSelectedChoice(judgementResponse.data.selected_choice); // 選択した選択肢を保存
      setCorrectChoice(judgementResponse.data.correct_choice); // 正解の選択肢を保存

    } catch (err) {
      console.error("クイズ取得エラー:", err);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [diaryId]);

  const handleSubmit = () => {
    navigate(`/Result`); // 次の画面に遷移
  };

  // クイズデータがまだ読み込まれていない場合、ローディングを表示
  if (!sameQuiz || !differentQuiz) {
    return <div>Loading...</div>;
  }

  // 2つの選択肢を交互に表示する処理
  const mergedChoices = [];
  const sameChoices = Object.entries(sameQuiz.choices);
  const differentChoices = Object.entries(differentQuiz.choices);
  const maxLength = Math.max(sameChoices.length, differentChoices.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < sameChoices.length) mergedChoices.push({ key: sameChoices[i][0], text: sameChoices[i][1], type: "same" });
    if (i < differentChoices.length) mergedChoices.push({ key: differentChoices[i][0], text: differentChoices[i][1], type: "different" });
  }

  // 正解の選択肢とユーザーの選択を強調表示
  const getChoiceStyle = (choice) => {
    // ログでデバッグする（選択肢と正解）
    console.log('選択肢: ', choice.key, ' 正解: ', correctChoice);

    // selectedChoiceとcorrectChoiceがnullまたはundefinedでないことを確認
    if (selectedChoice && correctChoice) {
      // 選択肢と正解を比較（大文字に変換して比較）
      if (selectedChoice.toUpperCase() === choice.key.toUpperCase()) {
        return { backgroundColor: "#4CAF50", color: "#fff" }; // ユーザーの選択肢を緑に
      }
      if (choice.key.toUpperCase() === correctChoice.toUpperCase()) { // 正解選択肢を比較（大文字で比較）
        return { backgroundColor: "#f44336", color: "#fff" }; // 正解の選択肢を赤に
      }
    }
    return {}; // その他の選択肢は変更なし
  };

  return (
    <div style={styles.container}>
      {judgement !== null && (
        <div style={styles.judgement}>
          <h3>{judgement ? "O" : "X"}</h3> {/* 正解・不正解を大きく表示 */}
        </div>
      )}
      <h3>Q5 <u>{sameQuiz.question}</u></h3>
      <div style={styles.options}>
        {mergedChoices.map((choice, index) => (
          <div
            key={index}
            style={{
              ...styles.option,
              ...getChoiceStyle(choice), // 選択肢のスタイルを適用
            }}
          >
            <p>{choice.key.toUpperCase()}. {choice.text}</p> {/* (Same Language) と (Different Language) を削除 */}
          </div>
        ))}
      </div>
      {selectedChoice && (
        <div style={styles.result}>
          <p><strong>あなたの選択:</strong> {selectedChoice.toUpperCase()}</p>
          <p><strong>正解:</strong> {correctChoice}</p> {/* 正解を表示 */}
        </div>
      )}
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
    marginBottom: "15px",
    padding: "10px",
    cursor: "pointer",
    border: "1px solid #ccc",
    borderRadius: "5px",
    transition: "background-color 0.3s ease",
  },
  judgement: {
    textAlign: "center",
    fontSize: "24px",
    color: "#4CAF50",
    fontWeight: "bold",
  },
  result: {
    marginTop: "20px",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: "#e0f7fa",
  },
  submitButton: {
    marginTop: "30px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    padding: "15px 30px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default Answer5;
