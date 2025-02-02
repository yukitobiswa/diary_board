import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [teamName, setTeamName] = useState(""); // チーム名を格納するステート
  const navigate = useNavigate();
  const emojis = ["👍", "❤️", "😂", "😲", "😢"];
  const diaryContainerRef = useRef(null);
  const tokenRef = useRef(null); // Use a ref to store the token
 

    // チーム名を取得
    const fetchTeamName = useCallback(async () => {
      if (!tokenRef.current) return; // トークンがない場合は終了
      try {
        const response = await axios.get("http://localhost:8000/get_team_name", {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        });
        setTeamName(response.data.team_name); // チーム名をステートにセット
      } catch (error) {
        console.error("Error fetching team name:", error);
      }
    }, []);

  // Fetch diaries
  const fetchDiaries = useCallback(async () => {
    if (!tokenRef.current) return; // If token is not set, exit
    try {
      const response = await axios.get("http://localhost:8000/get_diaries", {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });
      const diaryData = response.data.diaries;
      const formattedMessages = diaryData.map((diary) => ({
        user_name: diary.user_name,
        diary_id: diary.diary_id,
        title: diary.title,
        content: diary.content,
        diary_time: diary.diary_time,
        reactions: diary.reactions || {},
      }));
      setMessages(formattedMessages);
      
    } catch (error) {
      console.error("Error fetching diaries:", error);
    }
  }, []);
  

  // Scroll to the bottom
  const scrollToBottom = useCallback(() => {
    if (diaryContainerRef.current) {
      diaryContainerRef.current.scrollTop = diaryContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Verify token and fetch diaries once
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/startpage");
        return;
      }
      tokenRef.current = token; // Store the token in the ref
      try {
        const response = await axios.post("http://localhost:8000/verify_token", {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.valid) {
          fetchDiaries(); // Fetch diaries if token is valid
          fetchTeamName(); // チーム名を取得
        } else {
          navigate("/startpage");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        navigate("/startpage");
      }
    };

    verifyToken(); // Verify token on mount
  }, [fetchDiaries,fetchTeamName,navigate]);

  const addReaction = async (messageId, emoji) => {
    // UI上で即座に反映させる
    const updatedMessages = messages.map((message) => {
      if (message.diary_id === messageId) {
        const updatedReactions = { ...message.reactions };
        updatedReactions[emoji] = (updatedReactions[emoji] || 0) + 1;
        return { ...message, reactions: updatedReactions };
      }
      return message;
    });
  
    setMessages(updatedMessages); // UIに即反映
  
    // サーバーへのリクエストは後で送る
    const payload = { diary_id: messageId, emoji };
  
    try {
      // サーバーに反映
      const response = await axios.post(
        "http://localhost:8000/add_reaction", 
        payload,
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
  
      if (response.status === 200) {
        console.log("Reaction successfully updated on the server.");
        // サーバーから新しいリアクションデータを取得して反映
        const updatedMessagesFromServer = messages.map((message) => {
          if (message.diary_id === messageId) {
            return { ...message, reactions: response.data.reactions };
          }
          return message;
        });
  
        setMessages(updatedMessagesFromServer); // サーバーから返ってきたデータでUIを更新
      } else {
        console.error("Error updating reaction on the server:", response.data);
      }
    } catch (error) {
      console.error("Error updating reaction on the server:", error);
    }
  };
  
  
  

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuItemClick = (item) => {
    switch (item) {
      case "クイズランキング":
        navigate("/Ranking");
        break;
      case "日記履歴":
        navigate("/log");
        break;
      case "クイズ履歴":
        navigate("/Quiz_log")
        break;
      case "設定":
        navigate("/Setting");
        break;
      case "ログアウト":
        navigate("/StartPage");
        break;
      default:
        break;
    }
  };


  const [loading, setLoading] = useState(false); // ロード状態を管理

  const sendAndAddDiary = async () => {
    if (newMessage.trim() === "" || newTitle.trim() === "") return;
    setLoading(true);
    const newDiary = { title: newTitle, content: newMessage };
    try {
      const response = await axios.post("http://localhost:8000/add_diary", newDiary, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (response.data.status) {
        fetchDiaries();
        setNewMessage("");
        setNewTitle("");
        alert("Diary added successfully!");
        navigate("/Quiz1");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error posting diary:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleQuizClick = async (diaryId) => {
    try {
      const response = await axios.get(`http://localhost:8000/get_same_quiz/${diaryId}`, {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });
      console.log(response.data);
      navigate(`/Question1/${diaryId}`);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", display: "flex" }}>
      {/* Sidebar */}
      <div
        style={{
          width: menuOpen ? "250px" : "0",
          height: "100vh",
          backgroundColor: "#fff",
          boxShadow: menuOpen ? "2px 0 5px rgba(0,0,0,0.2)" : "none",
          transition: "width 0.3s",
          overflowX: "hidden",
          zIndex: 1000,
          position: "fixed",
          left: 0,
        }}
      >
        {menuOpen && (
          <div style={{ padding: "20px" }}>
            <h3 style={{ margin: "0 0 20px" }}>
              <br />
              <br />
              <br />
              <br />
              <br />
              メニュー</h3>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {["クイズランキング","日記履歴", "クイズ履歴", "設定", "ログアウト"].map((item) => (
                <li
                  key={item}
                  onClick={() => handleMenuItemClick(item)}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #ddd",
                    cursor: "pointer",
                    color: "#007BFF",
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={toggleMenu}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#F44336",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              閉じる
            </button>
          </div>
        )}
      </div>
      {/* Menu Button */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: "20px",
          zIndex: 1100,
        }}
      >
        <button
          onClick={toggleMenu}
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          ☰
        </button>
      </div>
      {/* Main Content */}
      <div style={{ marginLeft: menuOpen ? "250px" : "0", flex: 1, padding: "10px" }}>
        <div style={{ maxWidth: "6000px", margin: "50px auto 0" }}>
        <h1 style={{ textAlign: "center" }}>{teamName}のDiary Board！</h1>
          <h2 style={{ textAlign: "center" }}>みんなと日記を共有しよう！</h2>
          {/* Display Diaries */}
             {/* 日記がない場合に「日記がありません」と表示 */}
             {messages.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", fontSize: "16px" }}>
              日記がありません
            </p>
            ) :(
          <div
            ref={diaryContainerRef}
            style={{
              border: "1px solid #ccc",
              borderRadius: "5px",
              height: "400px",
              overflowY: "scroll",
              padding: "10px",
              marginBottom: "10px",
              backgroundColor: "#F9F9F9",
            }}
          >
            {messages.map((message) => (
              <div key={message.diary_id} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    backgroundColor: "#fff",
                    padding: "10px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <p style={{ margin: 0, color: "#333" }}>User: {message.user_name}</p>
                  <h4>{message.title}</h4>
                  <p>{message.content}</p>
                  <span style={{ fontSize: "12px", color: "#999" }}>{message.diary_time}</span>
                  {/* Reaction Buttons */}
                  <div style={{ marginTop: "10px" }}>
                    {emojis.map((emoji, index) => {
                      const reactionKey = Object.keys(message.reactions)[index]; // reactionsのキーを順番に取得
                      return (
                        <button
                          key={emoji}
                          onClick={() => addReaction(message.diary_id, emoji)}
                          style={{
                            marginRight: "5px",
                            border: "none",
                            background: "none",
                            fontSize: "16px",
                            cursor: "pointer",
                          }}
                        >
                          {emoji} {message.reactions[reactionKey] || 0} {/* リアクション数を表示 */}
                        </button>
                      );
                    })}
                  </div>
                  

                  {/* クイズへボタン */}
                  <button
                    onClick={() => handleQuizClick(message.diary_id)}
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      backgroundColor: "#FFA500",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Quiz！
                  </button>
                </div>
              </div>
            ))}
          </div>
            )}
          {/* Input Area */}
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="titleInput" style={{ display: "block", marginBottom: "5px" }}>
              title
            </label>
            <input
              id="titleInput"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder=""
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                marginBottom: "10px",
              }}
            />
            <label htmlFor="contentInput" style={{ display: "block", marginBottom: "5px" }}>
              content
            </label>
            <textarea
              id="contentInput"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder=""
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                resize: "none",
                overflow: "hidden",
              }}
              rows={1}
            />
          </div>
            <button
              onClick={sendAndAddDiary}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "5px",
                backgroundColor: loading ? "#ccc" : "#4CAF50",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "日記投稿中..." : "日記を投稿する"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;