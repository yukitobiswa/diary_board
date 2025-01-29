import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const QuizCategorySelector = () => {
  const categories = [
    { id: 1, label: "culture" },
    { id: 2, label: "language" },
    { id: 3, label: "random" },
    { id: 4, label: "myself" },
  ];

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // カテゴリを選択・解除する関数
  const handleSelect = (id) => {
    if (selectedCategories.includes(id)) {
      // 選択済みのカテゴリを解除
      setSelectedCategories(selectedCategories.filter((category) => category !== id));
    } else {
      // 2つまで選択可能
      if (selectedCategories.length < 2) {
        setSelectedCategories([...selectedCategories, id]);
        setError(""); // エラー解除
      } else {
        setError("カテゴリは2つまで選択可能です。");
      }
    }
    console.log("Currently selected categories:", selectedCategories); // デバッグログ
  };

  // クイズ開始時のリクエスト送信
  const handleQuizStart = async () => {
    if (selectedCategories.length !== 2) {
      setError("カテゴリを2つ選択してください！");
      return;
    }

    const newQuizRequest = {
      category1: Number(selectedCategories[0]),
      category2: Number(selectedCategories[1]),
    };

    console.log("Request payload:", newQuizRequest); // デバッグ用リクエストデータの出力

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("ログインセッションが無効です。もう一度ログインしてください。");
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/generate_quiz",
        newQuizRequest,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("API Response:", response.data); // APIからのレスポンスを出力
      alert(`クイズを開始します: ${selectedCategories.join(", ")}`);
      navigate("/Quiz2");
    } catch (error) {
      console.error("クイズ生成エラー:", error);

      // エラーレスポンスの処理
      if (error.response) {
        console.error("Error Response:", error.response);
        setError(`エラーが発生しました: ${error.response.data.error || error.response.data.message}`);
      } else {
        console.error("Error Details:", error.message);
        setError(`エラーが発生しました: ${error.message}`);
      }
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "40px",
        width: "500px",
        margin: "50px auto",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>クイズのカテゴリ選択</h1>
      <p style={{ fontSize: "16px", color: "#555" }}>
        以下のカテゴリから<strong>2つ</strong>選んでください。
      </p>
      <div style={{ margin: "20px 0" }}>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelect(category.id)}
            style={{
              display: "block",
              margin: "10px auto",
              padding: "15px",
              width: "80%",
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
      <button
        onClick={handleQuizStart}
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
      {error && (
        <p style={{ textAlign: "center", color: "#FF0000", marginTop: "20px", fontSize: "14px" }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default QuizCategorySelector;
