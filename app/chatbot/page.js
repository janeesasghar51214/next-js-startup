"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import "../../styles/Chatbot.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const ws = useRef(null);

  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 🔒 Redirect if no token
  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  // ---------- Logout ----------
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // ---------- WebSocket Connect ----------
  useEffect(() => {
    if (!token) return;

    const wsUrl = `${API_BASE.replace(/^http/, "ws")}/ws?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log("✅ WS connected");

    ws.current.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        payload = { type: "message", from: "bot", content: event.data };
      }

      if (payload.type === "typing") {
        setTyping(true);
      } else if (payload.type === "message") {
        const who = payload.from || "bot";
        const msg = { role: who === "user" ? "user" : "bot", content: payload.content || "" };
        setMessages((prev) => [...prev, msg]);
        setTyping(false);
      } else if (payload.error) {
        setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Error occurred" }]);
        setTyping(false);
      }
    };

    ws.current.onclose = () => console.log("❌ WS closed");
    ws.current.onerror = () =>
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Connection error. Please refresh." }]);

    return () => ws.current && ws.current.close();
  }, [token]);

  // ---------- Fetch user chats ----------
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE}/chats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setChats(res.data))
      .catch(() =>
        setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Failed to load chats" }])
      );
  }, [token]);

  // ---------- Send message ----------
  const sendMessage = () => {
    if (!input || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const payload = { chat_id: selectedChat, role: "user", content: input };
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setTyping(true);
    ws.current.send(JSON.stringify(payload));
    setInput("");
  };

  // ---------- File Upload ----------
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const formData = new FormData();
    formData.append("file", uploadedFile);
    if (selectedChat) formData.append("chat_id", selectedChat);

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => [...prev, { role: "user", content: `📎 ${res.data.filename}` }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ File upload failed" }]);
    }
  };

  // ---------- Voice Input ----------
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.start();
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
  };

  return (
    <div className={`chatbot-container ${darkMode ? "dark" : ""}`}>
      <div className="sidebar">
        <h2>Your Chats</h2>
        <ul>
          {chats.map((chat, i) => (
            <li
              key={chat.id || i}
              className={selectedChat === chat.id ? "active" : ""}
              onClick={() => {
                setSelectedChat(chat.id);
                if (chat.messages)
                  setMessages(chat.messages.map((m) => ({ role: m.role, content: m.content })));
              }}
            >
              {chat.title || `Chat #${i + 1}`}
            </li>
          ))}
        </ul>
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
        <button onClick={handleLogout} className="logout-btn">🚪 Logout</button>
      </div>

      <div className="chat-window">
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {typing && <div className="typing">Bot is typing...</div>}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
          <button onClick={handleVoiceInput}>🎤</button>
          <input type="file" onChange={handleFileUpload} />
        </div>
      </div>
    </div>
  );
}
