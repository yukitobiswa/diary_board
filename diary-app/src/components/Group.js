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
        team_name: groupName,
        team_id: invitePassword,
        country: countryId,
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
      width: "90%",
      padding: "12px",
      border: "none",
      borderRadius: "8px",
      margin: "10px 0",
    },
    select: {
      width: "95%",
      padding: "12px",
      border: "none",
      borderRadius: "8px",
      margin: "10px 0",
    },
    displayOnly: {
      width: "90%",
      padding: "12px",
      border: "none",
      borderRadius: "8px",
      margin: "10px 0",
      backgroundColor: "#eee",
      color: "#333",
      textAlign: "center",
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
      <h2>グループ作成</h2>

      {/* グループ名入力 */}
      <div>
        <label htmlFor="groupName" style={{ display: "block", marginBottom: "10px" }}>
          グループ名
        </label>
        <input
          id="groupName"
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* 招待パスワード入力 */}
      <div>
        <label htmlFor="invitePassword" style={{ display: "block", marginBottom: "10px" }}>
          招待パスワード
        </label>
        <input
          id="invitePassword"
          type="password"
          value={invitePassword}
          onChange={(e) => setInvitePassword(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* 国選択 */}
      <div>
        <label htmlFor="country" style={{ display: "block", marginBottom: "10px" }}>
          国を選択
        </label>
        <select
          id="country"
          value={countryId}
          onChange={(e) => setCountryId(Number(e.target.value))}
          style={styles.select}
        >
          {Object.entries(country_map).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* 年齢入力 */}
      <div>
        <label htmlFor="age" style={{ display: "block", marginBottom: "10px" }}>
          年齢
        </label>
        <input
          id="age"
          type="number"
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          style={styles.input}
        />
      </div>

      {/* 成功メッセージ */}
      {successMessage && <div style={{ color: "green", marginBottom: "10px" }}>{successMessage}</div>}

      {/* エラーメッセージ */}
      {errorMessage && <div style={{ color: "red", marginBottom: "10px" }}>{errorMessage}</div>}

      {/* ボタン */}
      <button onClick={handleCreateGroup} style={styles.button}>
        作成
      </button>
      <button onClick={handleGoBack} style={{ ...styles.button, backgroundColor: "#4CAF50" }}>
        戻る
      </button>
    </div>
  );
};

export default GroupsPage;
