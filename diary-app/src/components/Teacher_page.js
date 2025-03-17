import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Teacher_page = () => {
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [openUserId, setOpenUserId] = useState(null);
    const navigate = useNavigate();
    const tokenRef = useRef(localStorage.getItem("authToken") || null);

    const fetchUsers = async () => {
        if (!tokenRef.current) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/get_student_inf`, {
                headers: {
                    Authorization: `Bearer ${tokenRef.current}`,
                },
            });

            const userData = response.data;
            setTeachers(userData.filter(user => user.is_admin));
            setStudents(userData.filter(user => !user.is_admin));
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
                const response = await axios.post(`${API_BASE_URL}/verify_token`, {}, {
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
                <p style={{ textAlign: "center", color: "#777" }}>No User</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {users.map((user) => (
                        <div key={user.user_id} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            <div
                                style={{
                                    padding: "15px",
                                    backgroundColor: "#ffcc30",
                                    border: "1px solid #ffb74d",
                                    borderRadius: "10px",
                                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                                onClick={() => toggleAccordion(user.user_id)}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexGrow: 1 }}>
                                    <span style={{ fontSize: "16px", color: "#555", flexShrink: 0 }}>{user.user_id}</span>
                                    <span style={{ fontSize: "20px", color: "black", fontWeight: "bold" }}>
                                        {user.name}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/Diary_and_Quiz/${user.user_id}`);
                                    }}
                                    style={{
                                        padding: "5px 10px",
                                        backgroundColor: "#4caf50",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "5px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Diary & Quiz
                                </button>
                            </div>
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
                                    <p><strong>Quiz Count:</strong> {user.answer_count}</p>
                                    <p><strong>Diary Count:</strong> {user.diary_count}</p>
                                    <p><strong>Nickname:</strong> {user.nickname || "None"}</p>
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
            <h2 style={{ textAlign: "center" }}>Teacher Page</h2>
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
                ◀ Back
            </button>
            {/* Team Setting ボタンの追加 */}
            <button
                onClick={() => navigate("/team_set")}
                style={{
                    marginBottom: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginLeft: "10px",
                }}
            >
                Team Settings
            </button>

            {/* 教員リスト */}
            <UserList title="Teacher" users={teachers} />

            {/* 生徒リスト */}
            <UserList title="Students" users={students} />
        </div>
    );
};

export default Teacher_page;
