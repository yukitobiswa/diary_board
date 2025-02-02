import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Teacher_startpage = () => {
  const[teamId,setTeamId] = useState('')
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // This block is Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (userId === '' || password === '') {
      setError('All fields are required!');
      return;
    }

    // This is to make a POST request to add the new course

    axios.post('http://localhost:8000/token', 
      new URLSearchParams({
        team_id:teamId,
        username: userId,
        password: password
      }), 
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
      .then(response => {
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token);
          setSuccess('Login successfully!');
          setError('');
          navigate('/Chat'); // Redirect to home page on successful login
        } else {
          setError('Login failed. Invalid credentials.');
          setSuccess('');
        }

    })
    .catch(error => {
      setError('Error');
      setSuccess('');
    });
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "40px",
        width: "500px",
        margin: "50px auto",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        backgroundColor: "#FFF",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "20px", color: "#333" }}>ログイン</h1>
      <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "16px", display: "block", marginBottom: "8px", color: "#555" }}>グループ ID:</label>
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
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "16px", display: "block", marginBottom: "8px", color: "#555" }}>ユーザー ID:</label>
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
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "16px", display: "block", marginBottom: "8px", color: "#555" }}>パスワード:</label>
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
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <button
            onClick={() => navigate('/newlogin')}
            style={{
              padding: "20px 30px",
              backgroundColor: "#FFA500",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "background-color 0.3s",
              flex: "1",
              margin: "0 5px",
            }}
          >
            新規登録
        </button>
          <button
            type="submit"
            style={{
              padding: "20px 30px",
              backgroundColor: "#4CAF50",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "background-color 0.3s",
              flex: "1",
              margin: "0 5px",
            }}
          >
            ログイン
          </button>
          <button
            onClick={() => navigate('/Teacher_login')}
            style={{
              padding: "20px 30px",
              backgroundColor: "#FFA500",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "background-color 0.3s",
              flex: "1",
              margin: "0 5px",
            }}
          >
            教員ページへ
          </button>
        </div>
      </form>
      {success && <p style={{ color: "green", marginTop: "20px" }}>{success}</p>}
      {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}
    </div>
  );
};

export default Teacher_startpage;