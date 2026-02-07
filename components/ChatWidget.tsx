"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  message: string;
  senderId: string;
  createdAt: string;
  sender: {
    name: string;
    role: string;
  };
}

export default function ChatWidget() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Hide chat widget in admin routes
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  // Notify parent about chat state
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.setAttribute("data-chat-open", isOpen.toString());
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when chat opens
  useEffect(() => {
    if (isOpen && session) {
      fetchMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, session]);

  // Fetch unread count when logged in
  useEffect(() => {
    if (session) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/chat/unread");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;
  if (isAdminRoute) return null; // Don't show chat widget in admin routes

  return (
    <div className="fixed bottom-5 right-5 lg:bottom-8 lg:right-8 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-[#1f4b99] text-white rounded-full p-4 shadow-lg hover:bg-[#163a79] transition-all hover:scale-105"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-[350px] sm:w-[400px] h-[500px] flex flex-col">
          {/* Header */}
          <div className="bg-[#1f4b99] text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Support Chat</h3>
              <p className="text-xs text-white/80">
                We typically reply within minutes
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          {!session ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <svg
                className="w-16 h-16 text-slate-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">
                Login Required
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Please login or create an account to start chatting with our
                support team.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="bg-[#1f4b99] text-white px-4 py-2 rounded-lg hover:bg-[#163a79] transition-colors text-sm font-semibold"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:border-[#1f4b99] hover:text-[#1f4b99] transition-colors text-sm font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm mt-8">
                    <p>No messages yet.</p>
                    <p className="mt-1">Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender.role === "ADMIN";
                    const isUserMessage = !isAdmin;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            isUserMessage
                              ? "bg-[#1f4b99] text-white"
                              : "bg-slate-100 text-slate-900"
                          }`}
                        >
                          {isAdmin && (
                            <p className="text-xs font-semibold mb-1 text-slate-600">
                              Support Team
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.message}
                          </p>
                          <p
                            className={`text-xs mt-1 ${isUserMessage ? "text-white/70" : "text-slate-500"}`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={sendMessage}
                className="p-4 border-t border-slate-200"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 focus:border-[#1f4b99] text-sm"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="bg-[#1f4b99] text-white px-4 py-2 rounded-lg hover:bg-[#163a79] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
