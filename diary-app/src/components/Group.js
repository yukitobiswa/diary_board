import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const GroupsPage = () => {
  const [groupName, setGroupName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [countryId, setCountryId] = useState(1);  // 初期値は日本
  const [age, setAge] = useState(10);  // 初期値は10
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const country_map = {
    1: "Japan",  // 日本
    2: "United States",  // アメリカ
    3: "Portugal",  // ポルトガル
    4: "Spain",  // スペイン
    5: "China",  // 中国（簡体）
    6: "Taiwan",  // 台湾（繁体）
    7: "South Korea",  // 韓国
    8: "Philippines",  // フィリピン
    9: "Vietnam",  // ベトナム
    10: "Indonesia",  // インドネシア
    11: "Nepal",  // ネパール
    12: "France",  // フランス
    13: "Germany",  // ドイツ
    14: "Italy",  // イタリア
    15: "Russia",  // ロシア
    16: "India",  // インド
    17: "Brazil",  // ブラジル
    18: "Mexico",  // メキシコ
    19: "Turkey",  // トルコ
    20: "Australia",  // オーストラリア
    21: "Peru",  // ペルー
  };

  const handleCreateGroup = async () => {
    try {
      // リクエストデータ
      const teamData = {
        team_id: groupName,
        team_name: invitePassword,
        country_id: countryId,
        age: age,
      };
  
      // データをコンソールに表示
      console.log("送信するデータ:", teamData);
  
      // FastAPI エンドポイントに POST リクエストを送信
      const response = await axios.post('http://localhost:8000/team_register', teamData);
      setSuccessMessage(response.data.message);
      setErrorMessage("");
  
      // 成功したらページ遷移
      navigate("/startpage");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("グループ作成に失敗しました。");
      setSuccessMessage("");
    }
  };
  

  const handleGoBack = () => {
    navigate("/startpage");
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F9F9F9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "400px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          backgroundColor: "#fff",
        }}
      >
        {/* タイトル */}
        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>グループ作成</h3>

        {/* グループ名入力 */}
        <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
          グループ名
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="グループ名を入力"
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        {/* 招待パスワード入力 */}
        <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
          招待パスワード
        </label>
        <input
          type="password"
          value={invitePassword}
          onChange={(e) => setInvitePassword(e.target.value)}
          placeholder="パスワードを入力"
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        {/* 国選択 */}
        <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
          国を選択
        </label>
        <select
          value={countryId}
          onChange={(e) => setCountryId(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        >
          {Object.entries(country_map).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        {/* 年齢入力 */}
        <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
          年齢
        </label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          placeholder="年齢を入力"
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />

        {/* ボタン */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleCreateGroup}
            style={{
              padding: "10px 20px",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            作成
          </button>
        </div>

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
      </div>
    </div>
  );
};

export default GroupsPage;
