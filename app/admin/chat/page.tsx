"use client";

import { useState, useEffect, useRef } from "react";
import Container from "@/components/Container";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Message {
  id: string;
  message: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface Conversation {
  id: string;
  userId: string;
  user: User;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
  messages: Message[];
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      const interval = setInterval(
        () => fetchMessages(selectedConversation.id),
        3000,
      );
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/admin/chat");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/admin/chat/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          message: newMessage,
        }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages(selectedConversation.id);
        fetchConversations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Container>
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Support Chat Dashboard
        </h1>

        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          {/* Conversations List */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-[calc(100vh-200px)] flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Conversations</h2>
              <p className="text-xs text-slate-500 mt-1">
                {conversations.length} active{" "}
                {conversations.length === 1 ? "chat" : "chats"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full px-4 py-3 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedConversation?.id === conv.id
                        ? "bg-slate-50 border-l-4 border-l-[#1f4b99]"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-slate-900 text-sm">
                        {conv.user.name}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[#1f4b99] text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-1">
                      {conv.user.email}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-xs text-slate-600 truncate">
                        {conv.lastMessage}
                      </p>
                    )}
                    {conv.lastMessageAt && (
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(conv.lastMessageAt).toLocaleString()}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-[calc(100vh-200px)] flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-slate-300 mx-auto mb-4"
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
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">
                    {selectedConversation.user.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedConversation.user.email}
                  </p>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4"
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm mt-8">
                      No messages in this conversation
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdmin = msg.sender.role === "ADMIN";

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-3 ${
                              isAdmin
                                ? "bg-[#1f4b99] text-white"
                                : "bg-slate-100 text-slate-900"
                            }`}
                          >
                            {!isAdmin && (
                              <p className="text-xs font-semibold mb-1 text-slate-600">
                                {msg.sender.name}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.message}
                            </p>
                            <p
                              className={`text-xs mt-1 ${isAdmin ? "text-white/70" : "text-slate-500"}`}
                            >
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={sendMessage}
                  className="px-6 py-4 border-t border-slate-200"
                >
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 focus:border-[#1f4b99]"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !newMessage.trim()}
                      className="bg-[#1f4b99] text-white px-6 py-2 rounded-lg hover:bg-[#163a79] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
