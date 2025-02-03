import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Teacher_page = () => {
    const [teachers, setTeachers] = useState([]); // 教員リスト
    const [students, setStudents] = useState([]); // 生徒リスト
    const [openUserId, setOpenUserId] = useState(null); // アコーディオンの開閉管理
    const navigate = useNavigate();
    const tokenRef = useRef(localStorage.getItem("authToken") || null);

    const fetchUsers = async () => {
        if (!tokenRef.current) return;

        try {
            const response = await axios.get("http://localhost:8000/get_student_inf", {
                headers: {
                    Authorization: `Bearer ${tokenRef.current}`,
                },
            });

            const userData = response.data;
            setTeachers(userData.filter(user => user.is_admin)); // 教員リスト
            setStudents(userData.filter(user => !user.is_admin)); // 生徒リスト
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                navigate("/startpage");
                return;
            }
            tokenRef.current = token;
            try {
                const response = await axios.post("http://localhost:8000/verify_token", {}, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.data.valid) {
                    fetchUsers();
                } else {
                    navigate("/startpage");
                }
            } catch (error) {
                console.error("Error verifying token:", error);
                navigate("/startpage");
            }
        };

        verifyToken();
    }, []);

    const toggleAccordion = (userId) => {
        setOpenUserId(openUserId === userId ? null : userId);
    };

    const UserList = ({ title, users }) => (
        <div style={{ marginTop: "30px" }}>
            <h3 style={{ textAlign: "center", color: users.length > 0 ? "black" : "#777" }}>
                {title} ({users.length})
            </h3>
            {users.length === 0 ? (
                <p style={{ textAlign: "center", color: "#777" }}>まだ{title}がいません</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {users.map((user) => (
                        <div key={user.user_id} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {/* アコーディオンのヘッダー */}
                            <div
                                style={{
                                    padding: "15px",
                                    backgroundColor: "#fff",
                                    border: "1px solid #ccc",
                                    borderRadius: "10px",
                                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between", // ← 追加：user_idとnameを左寄せ、ボタンを右端へ
                                    gap: "10px",
                                }}
                                onClick={() => toggleAccordion(user.user_id)}
                            >
                                {/* 左側: user_id と name */}
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexGrow: 1 }}>
                                    <span style={{ fontSize: "16px", color: "#555", flexShrink: 0 }}>{user.user_id}</span>
                                    <span style={{ fontSize: "20px", color: "black", fontWeight: "bold" }}>
                                        {user.name}
                                    </span>
                                </div>

                                {/* 右端: 詳細ボタン */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/user_inf/${user.user_id}`);
                                    }}
                                    style={{
                                        padding: "5px 10px",
                                        backgroundColor: "#007bff",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "5px",
                                        cursor: "pointer",
                                    }}
                                >
                                    日記・クイズ一覧
                                </button>
                            </div>


                            {/* アコーディオンの内容 */}
                            {openUserId === user.user_id && (
                                <div
                                    style={{
                                        padding: "10px",
                                        backgroundColor: "#f9f9f9",
                                        border: "1px solid #ddd",
                                        borderRadius: "10px",
                                        marginTop: "5px",
                                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                                    }}
                                >
                                    <p><strong>クイズ正解数:</strong> {user.answer_count}</p>
                                    <p><strong>日記投稿数:</strong> {user.diary_count}</p>
                                    <p><strong>Nickname:</strong> {user.nickname || "なし"}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h2 style={{ textAlign: "center" }}>教員ページ</h2>
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

            {/* 教員リスト */}
            <UserList title="教員" users={teachers} />

            {/* 生徒リスト */}
            <UserList title="生徒" users={students} />
        </div>
    );
};

export default Teacher_page;
