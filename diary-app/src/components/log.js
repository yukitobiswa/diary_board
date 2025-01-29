import React from "react";
import { useNavigate } from "react-router-dom";

const HistoryPage = ({ messages = [] }) => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>履歴ページ</h2>

      {/* 戻るボタン */}
      <button
        onClick={() => navigate("/Chat")}
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          backgroundColor: "#4caf50",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        戻る
      </button>

      {/* メッセージ履歴 */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "5px",
          padding: "10px",
          maxHeight: "500px",
          overflowY: "auto",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                borderBottom: "1px solid #ccc",
                marginBottom: "10px",
                paddingBottom: "10px",
                wordBreak: "break-word",
              }}
            >
              <h4 style={{ margin: "0 0 5px", color: message.user.color }}>
                {message.title}
              </h4>
              <p style={{ margin: "5px 0" }}>{message.text}</p>
              <span style={{ fontSize: "12px", color: "#999" }}>
                {message.user.name} - {message.timestamp}
              </span>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#888" }}>履歴はまだありません。</p>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
