import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const NewRegister = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [teamId, setTeamId] = useState('');
  const [username, setUsername] = useState('');
  const [icon, setIcon] = useState(null);
  const [language, setLanguage] = useState(1);  // デフォルトを1に変更
  const [studyLanguage, setStudyLanguage] = useState(1);  // デフォルトを1に変更
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // 言語オプション
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
  const handleRegister = (e) => {
    e.preventDefault();
  
    // 入力内容をコンソールに表示
    console.log("User ID:", userId);
    console.log("Team ID:", teamId);
    console.log("Password:", password);
    console.log("Username:", username);
    console.log("Main Language:", language);
    console.log("Learn Language:", studyLanguage);
  
    if (userId === '' || password === '' || teamId === '' || username === '') {
      setError('すべてのフィールドが必要です！');
      return;
    }
  
    // POSTリクエストを送信
    axios.post('http://localhost:8000/register', {
      user_id: userId,
      team_id: teamId,
      password: password,
      name: username,  // FastAPIのモデルに合わせて 'name' を使用
      main_language: language,
      learn_language: studyLanguage,
    })
    .then(response => {
      setSuccess('登録に成功しました！');
      setError('');
      navigate('/'); // 登録成功後の遷移先
    })
    .catch(error => {
      console.error('Registration error:', error);  // エラーの詳細をコンソールに表示
      if (error.response) {
        setError(`サーバーエラー: ${error.response.data.detail || error.message}`);
      } else if (error.request) {
        setError('サーバーへのリクエストに失敗しました。');
      } else {
        setError(`登録中にエラーが発生しました: ${error.message}`);
      }
    });
  };
  

  const handleGoBack = () => {
    navigate("/startpage"); // 新規登録画面に遷移
  };
  return (
    <div className="container add-course" style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>ユーザー新規登録</h1>
      <form onSubmit={handleRegister} style={{ backgroundColor: "#F9F9F9", padding: "20px", borderRadius: "8px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label>ユーザーID:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>チームID:</label>
          <input
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>パスワード:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>ユーザー名:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>好みの言語:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(Number(e.target.value))}  // 数字に変換
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          >
            {languageOptions.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>学習言語:</label>
          <select
            value={studyLanguage}
            onChange={(e) => setStudyLanguage(Number(e.target.value))}  // 数字に変換
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          >
            {languageOptions.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          登録
        </button>
        {/* 戻るボタン */}
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <button
            onClick={handleGoBack}
            style={{
              backgroundColor: "#2196F3",
              color: "#fff",
              padding: "8px 12px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            ← 戻る
          </button>
        </div>
      </form>
      {success && <p style={{ color: "green", marginTop: "10px" }}>{success}</p>}
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
    
  );
};
export default NewRegister;