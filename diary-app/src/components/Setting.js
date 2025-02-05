import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Setting = () => {
  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState("");
  const [nickname, setNickname] = useState(""); // 称号は表示専用
  const navigate = useNavigate();

  const languageOptions = [
    { id: 1, label: "日本語" },
    { id: 2, label: "English" },
    { id: 3, label: "Português" },
    { id: 4, label: "Español" },
    { id: 5, label: "简体中文 (Simplified Chinese)" },
    { id: 6, label: "繁體中文 (Traditional Chinese)" },
    { id: 7, label: "한국어" },
    { id: 8, label: "Tagalog" },
    { id: 9, label: "Tiếng Việt" },
    { id: 10, label: "Bahasa Indonesia" },
    { id: 11, label: "नेपाली" },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get("http://localhost:8000/get_profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const { user_name, learn_language, nickname } = response.data; // nickname を取得
        setUsername(user_name);
        setLanguage(learn_language);
        setNickname(nickname); // nickname をセット
      } catch (error) {
        console.error("ユーザープロファイルの取得中にエラーが発生しました:", error);
        alert("ユーザー情報の取得に失敗しました。再度ログインしてください。");
        navigate("/login");
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setLanguage(Number(e.target.value));
  };

  const handleBack = () => {
    navigate("/Chat");
  };

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8000/get_profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { user_name: currentUserName, learn_language: currentLearnLanguage } = response.data;

      const updatedData = {
        user_name: username !== currentUserName ? username : null,
        learn_language: language !== currentLearnLanguage ? language : null,
      };

      const updateResponse = await axios.put(
        "http://localhost:8000/change_profile",
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(updateResponse.data.message);
    } catch (error) {
      console.error("プロフィール更新中にエラーが発生しました:", error);
      alert(error.response?.data?.detail || "ERROR");
    }
  };

  const styles = {
    container: {
      background: "linear-gradient(135deg, #FFA500, #4CAF50)",
      color: "#fff",
      padding: "40px",
      width: "600px",
      margin: "50px auto",
      borderRadius: "15px",
      boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
      textAlign: "center",
    },
    input: {
      width: "95%",
      padding: "12px",
      border: "none",
      borderRadius: "8px",
      margin: "10px 0",
    },
    select: {
      width: "100%",
      padding: "12px",
      border: "none",
      borderRadius: "8px",
      margin: "10px 0",
    },
    displayOnly: {
      width: "95%", // ここを90%に設定して、列が揃うように
      padding: "12px",
      border: "none",
      borderRadius: "8px",
      margin: "10px 0",
      backgroundColor: "#eee",
      color: "#333",
      textAlign: "center", // 中央寄せにする
    },
    button: {
      padding: "12px 24px",
      backgroundColor: "#FFA500",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      margin: "10px 5px",
      transition: "all 0.3s ease",
    },
  };

  return (
    <div style={styles.container}>
      <h2>My Profile</h2>

      <div style={{ marginBottom: "20px" }}>
        <div style={styles.displayOnly}>
          <strong>Nickname:</strong> {nickname || "称号が設定されていません"}
        </div>
      </div>

      <div>
        <label htmlFor="username" style={{ display: "block", marginBottom: "10px" }}>
          Name
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={handleUsernameChange}
          style={styles.input}
        />
      </div>

      <div>
        <label htmlFor="language" style={{ display: "block", marginBottom: "10px" }}>
          Learn Language
        </label>
        <select id="language" value={language} onChange={handleLanguageChange} style={styles.select}>
          <option value="">Please select</option>
          {languageOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button onClick={updateProfile} style={styles.button}>
        New！🆕
      </button>
      <button onClick={handleBack} style={{ ...styles.button, backgroundColor: "#4CAF50" }}>
      ◀ Back
      </button>
    </div>
  );
};

export default Setting;
