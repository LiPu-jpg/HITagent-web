"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      
      if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: `错误: ${data.error}` }]);
        return;
      }

      const content = data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error instanceof Error ? error.message : "Unknown error"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">HITA Agent</h1>

      <div className="w-full max-w-4xl flex-1 overflow-auto mb-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 p-4 rounded-lg whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-blue-500 text-white ml-auto max-w-[80%]"
                : "bg-white shadow mr-auto max-w-[80%] border"
            }`}
          >
            <p>{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className="bg-white shadow mr-auto max-w-[80%] p-4 rounded-lg">
            <p className="text-gray-500 animate-pulse">思考中...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-4xl flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          发送
        </button>
      </form>
    </main>
  );
}
