
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Teacher_startpage = () => {
    const [password, setPassword] = useState('');
    const [teamId, setTeamId] = useState('');
    const [userId, setUserId] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

  // フォーム送信の処理
const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '') {
        setError('ERROR : パスワードを入力してください');
        setSuccess('');
        return;
    }

    // POSTリクエストを送信
    axios.post('http://localhost:8000/token',
        new URLSearchParams({
            team_id: teamId,
            username: userId,
            password: password
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
        .then(response => {
            if (response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                setSuccess('OK！: ログインに成功しました！');
                setError('');
                navigate('/Chat'); // Redirect to home page on successful login
            } else {
                setError('ERROR : ログインに失敗しました');
                setSuccess('');
            }
        })
        .catch(error => {
            if (error.response && error.response.status === 401) {
                setError('ERROR : パスワードが間違っています');
            } else {
                setError('ERROR : ログインに失敗しました');
            }
            setSuccess('');
        });
};


    const styles = {
        container: {
            background: "linear-gradient(135deg, rgba(255, 165, 0, 0.8), rgba(76, 175, 80, 0.8))", // Lighter Orange to Green gradient with opacity
            color: "#fff",
            padding: "40px",
            width: "600px",
            margin: "50px auto",
            borderRadius: "15px",
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
            textAlign: "center",
        },
        button: {
            padding: "10px 20px",
            backgroundColor: "#007BFF",
            color: "#FFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "20px",
            transition: "background-color 0.3s",
            textAlign: "left", // Left alignment
            display: "block",
        },
        input: {
            width: "100%",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            fontSize: "16px",
        },
        formButton: {
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
        },
        loginButton: {
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
        },
        errorMessage: {
            color: "red",
            marginTop: "20px",
        },
        successMessage: {
            color: "green",
            marginTop: "20px",
        },
    };

    return (
        <div style={styles.container}>
            <button onClick={() => navigate('/StartPage')} style={styles.button}>
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
                        style={styles.input}
                    />
                </div>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "16px", display: "block", marginBottom: "8px", color: "#555" }}>Teacher ID:</label>
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        style={styles.input}
                    />
                </div>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "16px", display: "block", marginBottom: "8px", color: "#555" }}>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                    />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                    <button onClick={() => navigate('/Teacher_newlogin')} style={styles.formButton}>
                        New！🆕
                    </button>
                    <button type="submit" style={styles.loginButton}>
                        Go！🚀
                    </button>
                    <button onClick={() => navigate('/register')} style={styles.formButton}>
                        New Team👥
                    </button>
                </div>
            </form>
            {success && <p style={styles.successMessage}>{success}</p>}
            {error && <p style={styles.errorMessage}>{error}</p>}
        </div>
    );
};

export default Teacher_startpage;
