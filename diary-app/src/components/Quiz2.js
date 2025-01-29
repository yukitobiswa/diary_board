import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Quiz2 = () => {
  const [categories, setCategories] = useState([
    { id: 1, label: "問１：" },
    { id: 2, label: "問２：" },
    { id: 3, label: "問３：" },
    { id: 4, label: "問４：" },
    { id: 5, label: "問５：" },
    { id: 6, label: "問６：" },
    { id: 7, label: "問７：" },
  ]);
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // コンポーネントの初期化時にキャッシュからクイズデータを取得
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("access_token"); // トークンを取得
        if (!token) {
          setError("ログインセッションがありません。再度ログインしてください。");
          return;
        }

        const response = await axios.get("http://localhost:8000/get_quizzes", {
          headers: {
            Authorization: `Bearer ${token}`,  // トークンをヘッダーに追加
          },
        });

        const quizzes = response.data.quizzes;

        // 取得したクイズデータをカテゴリに追加
        const updatedCategories = categories.map((category, index) => {
          if (quizzes[index]) {
            category.label = `問${index + 1}: ${quizzes[index].question}`; // クイズの質問をラベルに追加
          }
          return category;
        });

        setCategories(updatedCategories); // 更新されたカテゴリを設定
      } catch (error) {
        console.error("クイズデータ取得エラー:", error);
        setError("クイズデータの取得中にエラーが発生しました。");
      }
    };

    fetchQuizzes();
  }, []); // 初回レンダリング時にデータを取得

  const handleSelect = (id) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((category) => category !== id));
    } else {
      if (selectedCategories.length < 5) {
        setSelectedCategories([...selectedCategories, id]);
        setError(""); // エラー解除
      } else {
        setError("※5個選択までです");
      }
    }
  };

  const handleSaveQuiz = async () => {
    if (selectedCategories.length !== 5) {
      setError("問題を5つ選択してください！");
      return;
    }

    const selectedQuizzes = {
      selected_quizzes: selectedCategories,
    };

    try {
      const token = localStorage.getItem("access_token"); // トークンを取得
      if (!token) {
        setError("ログインセッションがありません。再度ログインしてください。");
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/save_quiz", // POSTリクエスト先のURL
        selectedQuizzes,
        {
          headers: {
            "Content-Type": "application/json", // ヘッダー設定
            Authorization: `Bearer ${token}`,  // トークンをヘッダーに追加
          },
        }
      );

      console.log(response.data);
      alert("クイズが保存されました！");
      navigate(`/Chat`); // 遷移先
    } catch (error) {
      console.error("クイズ保存エラー:", error);
      setError("クイズ保存中にエラーが発生しました。");
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "40px",
        width: "800px",
        margin: "50px auto",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>クイズ選択</h1>
      <p style={{ fontSize: "16px", color: "#555" }}>以下のクイズから<strong>5つ</strong>選んでください。</p>
      <div style={{ margin: "20px 0" }}>
      <div style={{ margin: "20px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
  {categories.map((category) => (
    <button
      key={category.id}
      onClick={() => handleSelect(category.id)}
      style={{
        display: "block",
        margin: "10px 0", // 上下のマージンを設定
        padding: "15px",
        width: "150%", // ボタンの幅を100%に設定
        maxWidth: "600px", // ボタンの最大幅を設定
        backgroundColor: selectedCategories.includes(category.id) ? "#FFA500" : "#FFF",
        border: "2px solid #FFA500",
        borderRadius: "8px",
        color: selectedCategories.includes(category.id) ? "#FFF" : "#FFA500",
        fontSize: "16px",
        cursor: "pointer",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      {category.label}
    </button>
  ))}
</div>
      </div>
      {error && (
        <p style={{ textAlign: "center", color: "#FF0000", marginTop: "20px", fontSize: "14px" }}>
          {error}
        </p>
      )}
      <button
        onClick={handleSaveQuiz}
        style={{
          marginTop: "20px",
          padding: "15px 30px",
          backgroundColor: "#4CAF50",
          color: "#FFF",
          border: "none",
          borderRadius: "8px",
          fontSize: "18px",
          cursor: "pointer",
          transition: "background-color 0.3s",
        }}
      >
        クイズへ
      </button>
    </div>
  );
};

export default Quiz2;
