import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import api from "../api/axios";

function Receiver() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const [tab, setTab] = useState("services");
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("");

  const [reviewService, setReviewService] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "receiver") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = io(import.meta.env.VITE_API_BASE);
    socketRef.current.emit("join", user._id);

    return () => {
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);

  useEffect(() => {
    if (!socketRef.current || !user?._id) return;

    const handler = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socketRef.current.on("receiveMessage", handler);

    return () => {
      socketRef.current?.off("receiveMessage", handler);
    };
  }, [user?._id]);

  useEffect(() => {
    fetchBookings();
    fetchServices();
  }, []);

  useEffect(() => {
    if (tab === "inquiry") {
      fetchChats();
    }
  }, [tab]);

  async function fetchChats() {
    try {
      const { data } = await api.get("/chats");
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch chats");
    }
  }

  async function fetchBookings() {
    try {
      const { data } = await api.get("/bookings/my");
      setBookings(data);
    } catch {}
  }

  async function fetchServices(location = "") {
    try {
      const url = location ? `/services?location=${location}` : `/services`;
      const { data } = await api.get(url);
      setServices(data);
    } catch {
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }

  async function bookService(service, problem) {
    if (!problem.trim()) {
      return alert("Describe the issue");
    }

    try {
      await api.post("/bookings", {
        serviceId: service._id,
        serviceName: service.name,
        price: service.price,
        problem,
      });
      fetchBookings();
      alert("Booking created 🎉");
    } catch (error) {
      alert("Booking failed");
    }
  }

  async function sendMessage() {
    if (!chatText.trim()) return;

    try {
      const { data } = await api.post("/chats", { text: chatText });
      socketRef.current?.emit("sendMessage", {
        toUserId: "admin",
        message: data,
      });
      setChatText("");
    } catch {
      alert("Message failed");
    }
  }

  async function submitReview() {
    if (!reviewService || !reviewComment.trim()) {
      return alert("Please fill all fields");
    }
    try {
      await api.post("/reviews", {
        service: reviewService,
        rating: reviewRating,
        text: reviewComment,
      });
      alert("Review submitted ⭐");
      setReviewComment("");
      setTab("services");
    } catch {
      alert("Review failed");
    }
  }

  function logout() {
    socketRef.current?.disconnect();
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div style={page}>
      <header style={topbar}>
        <h2>🎃 ServiceFinder</h2>
        <div>
          <span style={{ marginRight: 12 }}>Hi, {user?.name}</span>
          <button style={logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div style={tabs}>
        {["profile", "services", "bookings", "inquiry", "review"].map((t) => (
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
        {tab === "services" && (
          <>
            <div style={filterBar}>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={selectStyle}
              >
                <option value="">All Locations</option>
                <option value="gandhinagar">Gandhinagar</option>
                <option value="ahmedabad">Ahmedabad</option>
                <option value="surat">Surat</option>
                <option value="vadodara">Vadodara</option>
              </select>

              <button
                onClick={() => fetchServices(selectedLocation)}
                style={primaryBtn}
              >
                Filter
              </button>

              <button
                onClick={() => {
                  setSelectedLocation("");
                  fetchServices("");
                }}
                style={secondaryBtn}
              >
                Clear
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={grid}
            >
              {loadingServices ? (
                <p>Loading services...</p>
              ) : services.length === 0 ? (
                <p>No services available.</p>
              ) : (
                services.map((s) => (
                  <ServiceCard key={s._id} service={s} onBook={bookService} />
                ))
              )}
            </motion.div>
          </>
        )}

        {tab === "bookings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {bookings.length === 0 ? (
              <p>No bookings found.</p>
            ) : (
              bookings.map((b) => (
                <div key={b._id} style={bookingCard}>
                  <div>
                    <h4>{b.serviceName}</h4>
                    <p>{b.problem}</p>
                  </div>
                  <span style={status(b.status)}>{b.status}</span>
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === "inquiry" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={chatBox}>
              {messages.map((m) => (
                <div
                  key={m._id}
                  style={{
                    ...bubble,
                    alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                    background: m.sender === "user" ? "#f97316" : "#1e293b",
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
                placeholder="Type your message..."
                style={input}
              />
              <button style={sendBtn} onClick={sendMessage}>
                Send
              </button>
            </div>
          </motion.div>
        )}

        {tab === "review" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: 400, margin: "0 auto" }}
          >
            <div style={card}>
              <h3 style={{ marginBottom: 15 }}>Rate Service</h3>
              <select
                style={{ ...input, marginBottom: 15 }}
                value={reviewService}
                onChange={(e) => setReviewService(e.target.value)}
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              <div style={starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{
                      ...starStyle,
                      color: star <= reviewRating ? "#f97316" : "#475569",
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>

              <textarea
                placeholder="Write your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{ ...textarea, background: "#020617", color: "white", padding: 10 }}
              />

              <button
                style={{ ...primaryBtn, width: "100%", marginTop: 10 }}
                onClick={submitReview}
              >
                Submit Review
              </button>
            </div>
          </motion.div>
        )}

        {tab === "profile" && (
          <div>
            <p style={{ marginBottom: 15 }}>Go to Profile Page</p>
            <button style={primaryBtn} onClick={() => navigate("/profile")}>
              Open My Profile
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ServiceCard({ service, onBook }) {
  const [problem, setProblem] = useState("");

  return (
    <motion.div whileHover={{ scale: 1.03 }} style={card}>
      <h3>{service.name}</h3>
      <p style={{ fontSize: "0.85em", color: "#94a3b8" }}>
        📍 {service.serviceLocation}
      </p>
      <p>₹{service.price}</p>
      <textarea
        placeholder="Describe issue..."
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        style={textarea}
      />
      <button
        style={primaryBtn}
        onClick={() => {
          onBook(service, problem);
          setProblem("");
        }}
      >
        Book
      </button>
    </motion.div>
  );
}

const page = { minHeight: "100vh", background: "#020617", color: "white", fontFamily: "sans-serif" };
const topbar = { display: "flex", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #1e293b" };
const tabs = { display: "flex", gap: 10, padding: 16 };
const tabBtn = { padding: "8px 14px", borderRadius: 20, border: "none", color: "white", cursor: "pointer", transition: "0.3s" };
const content = { padding: 24 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 };
const card = { background: "#0f172a", padding: 20, borderRadius: 16 };
const bookingCard = { background: "#0f172a", padding: 16, borderRadius: 12, display: "flex", justifyContent: "space-between", marginBottom: 12 };
const filterBar = { marginBottom: 20, display: "flex", gap: 12, alignItems: "center" };
const selectStyle = { padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#020617", color: "white" };
const status = (s) => ({ color: s === "Accepted" ? "#22c55e" : s === "Rejected" ? "#ef4444" : s === "Completed" ? "#f97316" : "#eab308", fontWeight: 600 });
const chatBox = { background: "#0f172a", height: 320, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, overflowY: "auto" };
const bubble = { padding: "10px 14px", borderRadius: 16, maxWidth: "70%" };
const input = { flex: 1, padding: 10, borderRadius: 10, border: "1px solid #334155", background: "#0f172a", color: "white" };
const sendBtn = { background: "#f97316", border: "none", color: "white", padding: "10px 16px", borderRadius: 10, cursor: "pointer" };
const textarea = { width: "100%", minHeight: 60, marginBottom: 10, borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "white", padding: "8px", boxSizing: "border-box" };
const primaryBtn = { background: "#f97316", border: "none", color: "white", padding: "10px 16px", borderRadius: 10, cursor: "pointer" };
const secondaryBtn = { background: "#1e293b", border: "none", color: "white", padding: "10px 16px", borderRadius: 10, cursor: "pointer" };
const logoutBtn = { background: "#dc2626", border: "none", color: "white", padding: "6px 12px", borderRadius: 8, cursor: "pointer" };
const starContainer = { display: "flex", gap: 5, marginBottom: 15, justifyContent: "center" };
const starStyle = { fontSize: 30, cursor: "pointer" };

export default Receiver;

