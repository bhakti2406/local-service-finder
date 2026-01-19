import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import api from "../api/axios";

function Admin() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("user"));
  const socketRef = useRef(null);
  const chatBoxRef = useRef(null);

  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [chatText, setChatText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");

  useEffect(() => {
    if (!admin || admin.role !== "admin") {
      navigate("/");
    }
  }, [admin, navigate]);

  useEffect(() => {
    if (!admin?._id) return;

    socketRef.current = io(import.meta.env.VITE_API_BASE);
    socketRef.current.emit("join", admin._id);

    return () => {
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, [admin?._id]);

  useEffect(() => {
    fetchBookings();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (tab === "users") {
      fetchUsers();
    }
  }, [tab]);

  useEffect(() => {
    if (!socketRef.current || !admin?._id) return;

    const handler = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socketRef.current.on("receiveMessage", handler);

    return () => {
      socketRef.current?.off("receiveMessage", handler);
    };
  }, [admin?._id]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedUserId) {
      fetchChats();
    }
  }, [selectedUserId, tab]);

  async function fetchUsers() {
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch {
      setUsers([]);
    }
  }

  async function fetchBookings() {
    try {
      const { data } = await api.get("/bookings/all");
      setBookings(data);
    } catch {
      setBookings([]);
    }
  }

  async function fetchReviews() {
    try {
      const { data } = await api.get("/reviews");
      setReviews(data);
    } catch {
      setReviews([]);
    }
  }

  async function fetchChats() {
    if (!selectedUserId) return;
    try {
      const { data } = await api.get(`/chats?userId=${selectedUserId}`);
      setMessages(data);
    } catch {
      setMessages([]);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.put(`/bookings/${id}`, { status });
      fetchBookings();
    } catch {
      alert("Failed to update status");
    }
  }

  async function sendReply() {
    if (!chatText.trim() || !selectedUserId) return;
    try {
      const { data } = await api.post("/chats", {
        text: chatText,
        userId: selectedUserId,
      });

      socketRef.current?.emit("sendMessage", {
        toUserId: selectedUserId,
        message: data,
      });

      setChatText("");
    } catch {
      alert("Message failed to send");
    }
  }

  const openChat = (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    socketRef.current?.emit("join", userId);
    fetchChats();
  };

  function logout() {
    socketRef.current?.disconnect();
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div style={page}>
      <header style={topbar}>
        <h2>
          🎃 ServiceFinder{" "}
          <span style={{ fontSize: "0.6em", color: "#f97316" }}>
            (Admin Panel)
          </span>
        </h2>
        <div>
          <span style={{ marginRight: 12 }}>Admin: {admin?.name}</span>
          <button style={logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div style={tabs}>
        {["users", "bookings", "inquiry", "reviews"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...tabBtn,
              background: tab === t ? "#f97316" : "#1e293b",
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <main style={content}>
        {tab === "bookings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {bookings.length === 0 ? (
              <p>No bookings available.</p>
            ) : (
              bookings.map((b) => (
                <div key={b._id} style={adminCard}>
                  <div style={{ flex: 1 }}>
                    <h4>{b.serviceName}</h4>
                    <p style={{ color: "#94a3b8", fontSize: "0.9em" }}>
                      Customer: <b>{b.user?.name}</b> ({b.user?.email})
                    </p>
                    <p style={{ margin: "8px 0" }}>{b.problem}</p>
                    <span style={statusStyle(b.status)}>{b.status}</span>
                  </div>

                  <div style={actionGroup}>
                    <button
                      style={btnSmall("#22c55e")}
                      onClick={() => updateStatus(b._id, "Accepted")}
                    >
                      Accept
                    </button>
                    <button
                      style={btnSmall("#ef4444")}
                      onClick={() => updateStatus(b._id, "Rejected")}
                    >
                      Reject
                    </button>
                    <button
                      style={btnSmall("#38bdf8")}
                      onClick={() => updateStatus(b._id, "Completed")}
                    >
                      Complete
                    </button>
                    <button
                      style={btnSmall("#f97316")}
                      onClick={() => {
                        setTab("inquiry");
                        openChat(b.user?._id, b.user?.name);
                      }}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === "inquiry" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {!selectedUserId ? (
              <p style={{ textAlign: "center", marginTop: 40 }}>
                Select a customer from "Bookings" to start chatting.
              </p>
            ) : (
              <>
                <h4 style={{ marginBottom: 10 }}>
                  Chatting with: {selectedUserName}
                </h4>
                <div style={chatBox} ref={chatBoxRef}>
                  {messages.map((m) => (
                    <div
                      key={m._id}
                      style={{
                        ...bubble,
                        alignSelf: m.sender === "admin" ? "flex-end" : "flex-start",
                        background: m.sender === "admin" ? "#f97316" : "#1e293b",
                      }}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                    placeholder="Type reply..."
                    style={input}
                  />
                  <button style={sendBtn} onClick={sendReply}>
                    Reply
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {tab === "reviews" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={grid}>
            {reviews.map((r) => (
              <div key={r._id} style={adminCard}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <h4 style={{ color: "#f97316" }}>{r.service}</h4>
                  <span>⭐ {r.rating}/5</span>
                </div>
                <p style={{ marginTop: 10, fontStyle: "italic" }}>"{r.text}"</p>
                <p style={{ fontSize: "0.8em", color: "#64748b", marginTop: 10 }}>
                  — {r.user?.name || "Anonymous"}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              users
                .filter((u) => u.role === "receiver")
                .map((u) => (
                  <div key={u._id} style={adminCard}>
                    <h4>{u.name}</h4>
                    <p>Email: {u.email}</p>
                    <p>Phone: {u.phone || "N/A"}</p>
                    <p>Location: {u.location || "N/A"}</p>
                    <p style={{ fontSize: "0.8em", color: "#94a3b8" }}>
                      Joined: {new Date(u.createdAt).toDateString()}
                    </p>
                  </div>
                ))
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
const page = { minHeight: "100vh", background: "#020617", color: "white", fontFamily: "sans-serif" };
const topbar = { display: "flex", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #1e293b" };
const tabs = { display: "flex", gap: 10, padding: 16 };
const tabBtn = { padding: "8px 14px", borderRadius: 20, border: "none", color: "white", cursor: "pointer" };
const content = { padding: 24 };
const adminCard = { background: "#0f172a", padding: 20, borderRadius: 16, display: "flex", flexDirection: "column", marginBottom: 16, border: "1px solid #1e293b" };
const actionGroup = { display: "flex", gap: 8, marginTop: 15, flexWrap: "wrap" };
const btnSmall = (bg) => ({ background: bg, border: "none", color: "white", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.85em", fontWeight: "600" });
const statusStyle = (s) => ({ color: s === "Accepted" ? "#22c55e" : s === "Rejected" ? "#ef4444" : s === "Completed" ? "#38bdf8" : "#eab308", fontWeight: 600, fontSize: "0.9em" });
const chatBox = { background: "#0f172a", height: 350, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, overflowY: "auto", border: "1px solid #1e293b" };
const bubble = { padding: "10px 14px", borderRadius: 16, maxWidth: "70%" };
const input = { flex: 1, padding: 12, borderRadius: 10, border: "1px solid #334155", background: "#0f172a", color: "white" };
const sendBtn = { background: "#f97316", border: "none", color: "white", padding: "10px 20px", borderRadius: 10, cursor: "pointer" };
const logoutBtn = { background: "#dc2626", border: "none", color: "white", padding: "6px 12px", borderRadius: 8, cursor: "pointer" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 };
export default Admin;


