import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Teacher_startpage = () => {
    const [teamId, setTeamId] = useState('');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [teamError, setTeamError] = useState('');
    const [userError, setUserError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [forgotPassword, setForgotPassword] = useState(false); // 🔹 パスワード再設定リンクを表示するための状態
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // エラーリセット
        setTeamError('');
        setUserError('');
        setPasswordError('');
        setForgotPassword(false);
        setSuccess('');
    
        if (!teamId) {
          setTeamError('Team ID is required! : チームIDが必要です！');
          return;
        }
        if (!userId) {
          setUserError('User ID is required! : ユーザーIDが必要です！');
          return;
        }
        if (!password) {
          setPasswordError('Password is required! : パスワードが必要です！');
          return;
        }
    
        try {
          const response = await axios.post(
            `${API_BASE_URL}/token`,
            new URLSearchParams({
              team_id: teamId,
              username: userId,
              password: password,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );
    
          if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
            setSuccess('Login successfully!');
            navigate('/Chat'); // 成功したらチャットページへ
          } else {
            setUserError('Login failed: ユーザーIDまたはパスワードが違います。');
          }
        } catch (error) {
          if (error.response) {
            const status = error.response.status;
            const errorMessage = error.response.data.detail;
    
            if (status === 400) {
              setTeamError(errorMessage);
            } else if (status === 401) {
              setUserError(errorMessage);
            } else if (status === 403) {
              setPasswordError(errorMessage);
              setForgotPassword(true); // 🔹 パスワードリセットを表示する
            } else {
              setUserError('Login failed: ログインに失敗しました。');
            }
          } else {
            setUserError('Network error: ネットワークエラーが発生しました。');
          }
        }
      };

      return (
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 165, 0, 0.8), rgba(76, 175, 80, 0.8))",
          color: "#fff",
          padding: "40px",
          width: "600px",
          margin: "50px auto",
          borderRadius: "15px",
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}>
          <button onClick={() => navigate('/StartPage')} style={{
            padding: "10px 20px",
            backgroundColor: "#007BFF",
            color: "#FFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "20px",
            transition: "background-color 0.3s",
            textAlign: "left",
            display: "block",
          }}>
            ◀ Back
          </button>
          <h1 style={{ fontSize: "24px", marginBottom: "20px", color: "#333" }}>Teacher Login</h1>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "16px", display: "block", marginBottom: "8px", color: "#555" }}>Team ID:</label>
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  fontSize: "16px",
                }}
                
              />
               {teamError && <p style={{ color: "red", fontSize: "14px" }}>{teamError}</p>}
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "16px", display: "block", marginBottom: "8px", color: "#555" }}>Teacher ID:</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  fontSize: "16px",
                }}
              />
               {userError && <p style={{ color: "red", fontSize: "14px" }}>{userError}</p>}
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "16px", display: "block", marginBottom: "8px", color: "#555" }}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  fontSize: "16px",
                }}
              />
              {passwordError && <p style={{ color: "red", fontSize: "14px" }}>{passwordError}</p>}
              {forgotPassword && (
            <p>
              <button
                onClick={() => navigate('/reset_password')}
                style={{
                  background: "none",
                  border: "none",
                  color: "blue",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "14px",
                  marginTop: "5px",
                }}
              >
                Forgot your password? : パスワードを忘れましたか？
              </button>
            </p>
          )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button onClick={() => navigate('/Teacher_newlogin')} style={{
                padding: "20px 30px",
                backgroundColor: "#FFA500",
                color: "#FFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "20px",
                cursor: "pointer",
                transition: "background-color 0.3s",
                flex: "1",
                margin: "0 5px",
              }}>
                New！🆕
              </button>
              <button type="submit" style={{
                padding: "20px 30px",
                backgroundColor: "#4CAF50",
                color: "#FFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "20px",
                cursor: "pointer",
                transition: "background-color 0.3s",
                flex: "1",
                margin: "0 5px",
              }}>
                Go！🚀
              </button>
              <button onClick={() => navigate('/register')} style={{
                padding: "20px 30px",
                backgroundColor: "#FFA500",
                color: "#FFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "20px",
                cursor: "pointer",
                transition: "background-color 0.3s",
                flex: "1",
                margin: "0 5px",
              }}>
                New Team👥
              </button>
            </div>
          </form>
          {success && <p style={{ color: "green", marginTop: "20px" }}>{success}</p>}
          {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}
        </div>
      );
    };
    
    export default Teacher_startpage;