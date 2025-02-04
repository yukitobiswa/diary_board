import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const GroupsPage = () => {
  const [groupName, setGroupName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [selectedCountries, setSelectedCountries] = useState([]);  // 国名リスト
  const [age, setAge] = useState("1");  // 年齢（小学1年生）
  const [memberCount, setMemberCount] = useState(0);  // メンバー数
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const country_map = [
    "Japan",
    "United States",
    "Portugal",
    "Spain",
    "China",
    "Taiwan",
    "South Korea",
    "Philippines",
    "Vietnam",
    "Indonesia",
    "Nepal",
    "France",
    "Germany",
    "Italy",
    "Russia",
    "India",
    "Brazil",
    "Mexico",
    "Turkey",
    "Australia",
    "Peru",
  ];

  // Map numeric age to grade labels
  const getGradeLabel = (age) => {
    if (age >= 1 && age <= 6) {
      return `Elementary${age}`;
    } else if (age >= 7 && age <= 9) {
      return `Junior${age - 6}`;
    }
    return "";
  };

  const handleCountryChange = (e) => {
    const value = e.target.value;
    setSelectedCountries((prev) =>
      prev.includes(value) ? prev.filter((country) => country !== value) : [...prev, value]
    );
  };

  const handleCreateGroup = async () => {
    try {
      // Map selected age to grade label
      const gradeLabel = getGradeLabel(age);

      // リクエストデータ
      const teamData = {
        team_name: groupName,
        team_id: invitePassword,
        country: selectedCountries,  // 国名リスト
        age: gradeLabel,  // 年齢を学年に変換
        member_count: memberCount,  // メンバー数
      };

      // データをコンソールに表示
      console.log("送信するデータ:", teamData);

      // FastAPI エンドポイントに POST リクエストを送信
      const response = await axios.post('http://localhost:8000/team_register', teamData);
      setSuccessMessage(response.data.message);
      setErrorMessage("");

      // 成功したらページ遷移
      navigate("/teacher_startpage");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("ERROR occurred. Please try again.");
      setSuccessMessage("");
    }
  };

  const handleGoBack = () => {
    navigate("/teacher_startpage");
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
    checkboxGroup: {
      textAlign: "left",
      marginBottom: "10px",
    },
  };

  return (
    <div style={styles.container}>
      <h2>Team create</h2>

      {/* グループ名入力 */}
      <div>
        <label htmlFor="groupName" style={{ display: "block", marginBottom: "10px" }}>
          Team name
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
          Invite password
        </label>
        <input
          id="invitePassword"
          type="password"
          value={invitePassword}
          onChange={(e) => setInvitePassword(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* 国選択（チェックボックス） */}
      <div style={styles.checkboxGroup}>
        <label htmlFor="country" style={{ display: "block", marginBottom: "10px" }}>
          Country
        </label>
        {country_map.map((country) => (
          <div key={country}>
            <input
              type="checkbox"
              value={country}
              checked={selectedCountries.includes(country)}
              onChange={handleCountryChange}
              id={country}
            />
            <label htmlFor={country} style={{ marginLeft: "8px" }}>
              {country}
            </label>
          </div>
        ))}
      </div>

      {/* 年齢選択 */}
      <div>
        <label htmlFor="age" style={{ display: "block", marginBottom: "10px" }}>
          Age
        </label>
        <select
          id="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={styles.select}
        >
          {[
            "1", "2", "3", "4", "5", "6", // 小学1年生から6年生
            "7", "8", "9", // 中学1年生から3年生
          ].map((ageOption) => (
            <option key={ageOption} value={ageOption}>
              {ageOption < 7 ? `Element${ageOption}` : `Junior${ageOption - 6}`}
            </option>
          ))}
        </select>
      </div>

      {/* メンバー数入力 */}
      <div>
        <label htmlFor="memberCount" style={{ display: "block", marginBottom: "10px" }}>
          Member count
        </label>
        <input
          id="memberCount"
          type="number"
          value={memberCount}
          onChange={(e) => setMemberCount(Number(e.target.value))}
          style={styles.input}
        />
      </div>

      {/* 成功メッセージ */}
      {successMessage && <div style={{ color: "green", marginBottom: "10px" }}>{successMessage}</div>}

      {/* エラーメッセージ */}
      {errorMessage && <div style={{ color: "red", marginBottom: "10px" }}>{errorMessage}</div>}

      {/* ボタン */}
      <button onClick={handleCreateGroup} style={styles.button}>
        Create
      </button>
      <button onClick={handleGoBack} style={{ ...styles.button, backgroundColor: "#4CAF50" }}>
        Back
      </button>
    </div>
  );
};

export default GroupsPage;
