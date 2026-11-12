import { useState, useEffect, useRef } from "react";
import "./App.css";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

const RENDER_HOST = "esosa-ai-tutor-api.onrender.com";
const API_URL = `https://${RENDER_HOST}/teach`;




const INITIAL_MESSAGE: ChatMessage = {
  role: "ai",
  text: "Hi! Ask me anything, or click + to upload an image, video, PDF, or text file for me to explain.",
};

export default function App() {
  const [level, setLevel] = useState<string>(() => localStorage.getItem("study_level") || "Beginner");
  const [messages, setMessages] = useState<Array<ChatMessage>>(() => {
    const saved = localStorage.getItem("study_chat_history");
    return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
  });
  const [input, setInput] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.setItem("study_chat_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("study_level", level);
  }, [level]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !selectedFile) || loading) return;

    const displayLabel = selectedFile
      ? `📎 ${selectedFile.name}${trimmed ? `\n${trimmed}` : ""}`
      : trimmed;

    const updatedHistory: Array<ChatMessage> = [...messages, { role: "user", text: displayLabel }];
    setMessages(updatedHistory);

    const formData = new FormData();
    formData.append("message", trimmed);
    formData.append("level", level);
    formData.append("history", JSON.stringify(updatedHistory));
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    setInput("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "Success") {
        setMessages([...updatedHistory, { role: "ai", text: data.reply }]);
      } else {
        alert("❌ " + data.message);
      }
    } catch {
      alert("🚨 Server is waking up on Render. Wait 30 seconds and click Ask again!");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    const fresh: Array<ChatMessage> = [
      { role: "ai", text: "Started a fresh study session. Upload a file or ask a question!" },
    ];
    setMessages(fresh);
    setSelectedFile(null);
    localStorage.setItem("study_chat_history", JSON.stringify(fresh));
  };

  return (
    <div className="ai-page">
      <div className="top-bar">
        <span className="brand-title">✨ Esosa AI Study Tutor</span>
        <div className="top-actions">
          <select className="level-pill" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="Beginner">Beginner Mode</option>
            <option value="Intermediate">Intermediate Mode</option>
            <option value="Advanced">Advanced Mode</option>
          </select>
          <button className="new-chat-btn" onClick={handleNewChat}>
            New Chat
          </button>
        </div>
      </div>

      <div className="chat-feed">
        {messages.map((msg, idx) =>
          msg.role === "user" ? (
            <div key={idx} className="user-row">
              <div className="user-pill">{msg.text}</div>
            </div>
          ) : (
            <div key={idx} className="ai-row">
              <div className="ai-text">{msg.text}</div>
              {idx === messages.length - 1 && (
                <span className="disclaimer">AI responses may include mistakes. Verify important details.</span>
              )}
            </div>
          )
        )}

        {loading && (
          <div className="ai-row">
            <div className="ai-text" style={{ color: "#5f6368" }}>
              Analyzing and preparing your explanation...
            </div>
          </div>
        )}
      </div>

      <div className="input-container">
        {selectedFile && (
          <div className="attachment-chip">
            <span>📎 {selectedFile.name}</span>
            <button
              className="remove-file-btn"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              ×
            </button>
          </div>
        )}

        <input
          type="text"
          placeholder="Ask anything about your upload or type a topic..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <div className="input-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/pdf,.txt,.csv,.md"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            className="plus-btn"
            title="Upload image, video, or document"
            onClick={() => fileInputRef.current?.click()}
          >
            +
          </button>
          <button className="send-circle" onClick={handleSend} disabled={loading || (!input.trim() && !selectedFile)}>
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
