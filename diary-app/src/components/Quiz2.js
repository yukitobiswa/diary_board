import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Quiz2 = () => {
  const [categories, setCategories] = useState([
    { id: 1, label: "Q1 : " },
    { id: 2, label: "Q2 : " },
    { id: 3, label: "Q3 : " },
    { id: 4, label: "Q4 : " },
    { id: 5, label: "Q5 : " },
    { id: 6, label: "Q6 : " },
    { id: 7, label: "Q7 : " },
    { id: 8, label: "Q8 : " },
    { id: 9, label: "Q9 : " },
    { id: 10, label: "Q10 : " },
  ]);
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("ログインセッションがありません。再度ログインしてください。");
          return;
        }

        const response = await axios.get("http://localhost:8000/get_quizzes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const quizzes = response.data.quizzes;

        const updatedCategories = categories.map((category, index) => {
          if (quizzes[index]) {
            category.label = `Q${index + 1}: ${quizzes[index].question}`;
          }
          return category;
        });

        setCategories(updatedCategories);
      } catch (error) {
        console.error("クイズデータ取得エラー:", error);
        setError("クイズデータの取得中にエラーが発生しました。");
      }
    };

    fetchQuizzes();
  }, []);

  const handleSelect = (id) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((category) => category !== id));
    } else {
      if (selectedCategories.length < 5) {
        setSelectedCategories([...selectedCategories, id]);
        setError("");
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

    setIsSaving(true);
    const selectedQuizzes = {
      selected_quizzes: selectedCategories,
    };

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("ログインセッションがありません。再度ログインしてください。");
        setIsSaving(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/save_quiz",
        selectedQuizzes,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data);
      alert("クイズが保存されました！");
      navigate(`/Chat`);
    } catch (error) {
      console.error("クイズ保存エラー:", error);
      setError("クイズ保存中にエラーが発生しました。");
    } finally {
      setIsSaving(false);
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
      <div style={{ margin: "20px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelect(category.id)}
            style={{
              display: "block",
              margin: "10px 0",
              padding: "15px",
              width: "150%",
              maxWidth: "600px",
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
      {error && (
        <p style={{ textAlign: "center", color: "#FF0000", marginTop: "20px", fontSize: "14px" }}>
          {error}
        </p>
      )}
      <button
        onClick={handleSaveQuiz}
        disabled={isSaving}
        style={{
          marginTop: "20px",
          padding: "15px 30px",
          backgroundColor: isSaving ? "#ccc" : "#4CAF50",
          color: "#FFF",
          border: "none",
          borderRadius: "8px",
          fontSize: "18px",
          cursor: isSaving ? "not-allowed" : "pointer",
          transition: "background-color 0.3s",
        }}
      >
        {isSaving ? "クイズ保存中..." : "クイズ保存"}
      </button>
    </div>
  );
};

export default Quiz2;
