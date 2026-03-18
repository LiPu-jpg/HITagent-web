"use client";

import { useState } from "react";
import { chatWithAgent } from "./actions";
import { UnifiedCourseItem, UnifiedScoreItem, PRPreview } from "@/components";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatWithAgent([...messages, userMessage]);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">HITA Agent</h1>

      <div className="w-full max-w-4xl flex-1 overflow-auto mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 p-4 rounded-lg ${
              msg.role === "user"
                ? "bg-blue-100 ml-auto max-w-[80%]"
                : "bg-gray-100 mr-auto max-w-[80%]"
            }`}
          >
            <p>{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 mr-auto max-w-[80%] p-4 rounded-lg">
            <p className="text-gray-500">思考中...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-4xl flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          className="flex-1 p-3 border rounded-lg"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </main>
  );
}
