import React, { useEffect, useState } from "react"; // useEffectを一箇所にまとめる
import axios from "axios";
import { useNavigate } from "react-router-dom";
const GroupsPage = () => {
  const [groupName, setGroupName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  // グループ作成処理
  const handleCreateGroup = () => {
    console.log("グループ名:", invitePassword);
    console.log("招待パスワード:", groupName);
    // axiosでJSONデータを送信
    axios
      .post(
        "http://localhost:8000/team_register", // APIエンドポイント
        {
          team_id: invitePassword, // グループ名
          team_name: groupName, // 招待パスワード
        },
        {
          headers: { "Content-Type": "application/json" }, // JSON形式で送信
        }
      )
      .then((response) => {
        if (response.data.message) {
          setSuccessMessage("グループが正常に作成されました！");
          setErrorMessage("");
          navigate("/startpage"); 
        } else {
          setErrorMessage("グループが正常に作成されました！");
          setSuccessMessage("");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setErrorMessage("グループ作成中にエラーが発生しました。");
        setSuccessMessage("");
      });
  };

  const handleGoBack = () => {
    navigate("/startpage"); // 新規登録画面に遷移
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