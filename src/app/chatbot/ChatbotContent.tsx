"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { FaPaperPlane, FaRobot, FaUser, FaTrash } from "react-icons/fa";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "How do I upload a video?",
  "Tell me about HypeMode",
  "How does the marketplace work?",
  "What payment methods are supported?",
];

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-start flex-row">
      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 text-[13px] bg-bg-tertiary text-accent-primary border border-border-secondary">
        <FaRobot size={14} />
      </div>
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-[4px] bg-bg-elevated text-text-primary border border-border-secondary flex items-center">
        <div className="flex gap-1 p-1 items-center">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse-custom"
              style={{ animationDelay: `${delay}ms`, backgroundColor: "var(--color-text-tertiary)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default function ChatbotContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || isLoading) return;

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ messages: history }),
        });
        const data: { success: boolean; content: string; error?: string } = await res.json();
        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.content || "Sorry, I couldn't process that. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setInput("");
  }, []);

  const hasMessages = messages.length > 0;
  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div className="bg-bg-tertiary flex flex-col" style={{ minHeight: "calc(100vh - 60px)" }}>
      <div className="flex-1 flex flex-col max-w-[860px] w-full mx-auto px-4 pt-4 pb-0">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 bg-bg-elevated rounded-xl border border-border-secondary mb-3"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: "linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))" }}
            >
              <FaRobot size={18} />
            </div>
            <div>
              <div className="text-base font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                WeCinema AI
              </div>
              <div className="text-xs text-text-tertiary mt-0.5">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: "var(--color-success)" }}
                />
                Always online
              </div>
            </div>
          </div>
          {hasMessages && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-border-secondary rounded-[10px] bg-transparent text-text-tertiary text-xs font-medium cursor-pointer transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-danger)";
                e.currentTarget.style.borderColor = "var(--color-danger)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-tertiary)";
                e.currentTarget.style.borderColor = "var(--color-border-secondary)";
              }}
              aria-label="Clear chat"
            >
              <FaTrash size={10} />
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 px-1 flex flex-col gap-4 scroll-smooth min-h-[400px] max-h-[calc(100vh-260px)]">
          {!hasMessages && !isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10 text-center">
              <div
                className="w-16 h-16 rounded-[20px] text-accent-primary flex items-center justify-center"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)" }}
              >
                <FaRobot size={28} />
              </div>
              <h2 className="text-lg font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                WeCinema AI Assistant
              </h2>
              <p className="text-[13px] text-text-tertiary max-w-[360px] leading-relaxed">
                Ask me anything about WeCinema: uploads, marketplace, HypeMode, payments, or how to get started.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-4 py-2 rounded-full border border-border-secondary bg-bg-elevated text-text-secondary text-[13px] font-medium cursor-pointer transition-all"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-accent-primary)";
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-bg-elevated)";
                      e.currentTarget.style.color = "var(--color-text-secondary)";
                      e.currentTarget.style.borderColor = "var(--color-border-secondary)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id}>
                    <div className={`flex gap-2.5 items-start ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 text-[13px] ${
                          isUser
                            ? "bg-accent-primary text-white"
                            : "bg-bg-tertiary text-accent-primary border border-border-secondary"
                        }`}
                      >
                        {isUser ? <FaUser size={13} /> : <FaRobot size={14} />}
                      </div>
                      <div
                        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isUser
                            ? "bg-accent-primary text-white rounded-br-[4px]"
                            : "bg-bg-elevated text-text-primary border border-border-secondary rounded-bl-[4px]"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                    <div className={`text-[11px] text-text-tertiary mt-1 ${isUser ? "text-right pr-[42px]" : "text-left pl-[42px]"}`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                );
              })}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="pt-3 pb-4 flex gap-2.5 items-end">
          <div
            className={`flex-1 flex items-end bg-bg-elevated border rounded-2xl px-4 py-1 pr-1 transition-all ${
              isFocused ? "border-accent-primary" : "border-border-secondary"
            }`}
            style={isFocused ? { boxShadow: "0 0 0 2px color-mix(in srgb, var(--color-accent-primary) 10%, transparent)" } : undefined}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask me anything about WeCinema..."
              className="flex-1 border-0 outline-none bg-transparent text-sm text-text-primary resize-none max-h-[120px] min-h-[40px] py-2 leading-normal"
              rows={1}
              disabled={isLoading}
              aria-label="Type your message"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!canSend}
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                canSend ? "bg-accent-primary text-white cursor-pointer" : "bg-bg-tertiary text-text-tertiary cursor-default"
              }`}
              aria-label="Send message"
            >
              <FaPaperPlane size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
