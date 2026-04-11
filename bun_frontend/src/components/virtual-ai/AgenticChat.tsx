import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiClient from "../../services/apiClient";
import "./AgenticChat.css";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export default function AgenticChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isFullScreen]);

    // Helper to create a new conversation and initialize chat
    const createNewConversation = async (): Promise<string | null> => {
        try {
            const res = await apiClient.post("/chat/conversations", {
                title: "Agentic Session",
                mode: "agentic"
            });

            const newId = res.data.conversation.id;

            const newMessages: Message[] = [
                {
                    id: "init",
                    role: "assistant",
                    content: "I am **Kartr Agentic Intelligence**. I analyze your influencer ecosystem using real-time market data.\n\n*What strategic objective shall we address today?*",
                    created_at: new Date().toISOString()
                }
            ];

            setConversationId(newId);
            setMessages(newMessages);

            // Clear old state and save new
            localStorage.removeItem("agentic_chat_state");

            return newId;
        } catch (err) {
            console.error("Failed to create conversation", err);
            setError("Failed to initialize Agentic Intelligence connection.");
            return null;
        }
    };

    // Load state from local storage on mount
    useEffect(() => {
        const loadState = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const savedState = localStorage.getItem("agentic_chat_state");
                if (savedState) {
                    const parsed = JSON.parse(savedState);

                    // Verify the conversation still exists on the server
                    try {
                        await apiClient.get(`/chat/conversations/${parsed.conversationId}`);
                        // Conversation exists, restore state
                        setConversationId(parsed.conversationId);
                        setMessages(parsed.messages);
                        return;
                    } catch (verifyErr: any) {
                        // Conversation not found (404) or other error - create a new one
                        console.warn("Saved conversation not found, creating new one", verifyErr);
                        localStorage.removeItem("agentic_chat_state");
                    }
                }

                // If no saved state or conversation not found, initialize new chat
                await createNewConversation();

            } catch (err: any) {
                console.error("Failed to init chat", err);
                setError("Failed to initialize Agentic Intelligence connection.");
            }
        };

        loadState();
    }, []);

    // Save state to local storage whenever it changes
    useEffect(() => {
        if (conversationId && messages.length > 0) {
            localStorage.setItem("agentic_chat_state", JSON.stringify({
                conversationId,
                messages
            }));
        }
    }, [conversationId, messages]);

    const handleSend = async () => {
        if (!input.trim() || !conversationId || isLoading) return;

        const userMsg = input;
        setInput("");
        setError(null);

        // Optimistic UI update
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: tempId,
            role: "user",
            content: userMsg,
            created_at: new Date().toISOString()
        }]);

        setIsLoading(true);

        try {
            // apiClient handles headers and base URL
            const res = await apiClient.post(`/chat/conversations/${conversationId}/messages`, {
                message: userMsg
            });

            // Replace optimistic message with real one and add assistant response
            // But simpler: just append assistant response
            setMessages(prev => [
                ...prev,
                res.data.assistant_message
            ]);
        } catch (err: any) {
            console.error("Send failed", err);

            // Check if it's a 404 (conversation not found) error
            if (err.response?.status === 404) {
                console.warn("Conversation not found, creating new conversation and retrying...");

                // Create a new conversation
                const newConvoId = await createNewConversation();

                if (newConvoId) {
                    // Add the user message to the new conversation's messages
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: "user",
                        content: userMsg,
                        created_at: new Date().toISOString()
                    }]);

                    // Retry sending the message with the new conversation
                    try {
                        const retryRes = await apiClient.post(`/chat/conversations/${newConvoId}/messages`, {
                            message: userMsg
                        });

                        setMessages(prev => [
                            ...prev,
                            retryRes.data.assistant_message
                        ]);
                        setError(null);
                    } catch (retryErr: any) {
                        console.error("Retry send failed", retryErr);
                        setError("Failed to send message. Please try again.");
                    }
                } else {
                    setError("Session expired. Please refresh the page to start a new conversation.");
                }
            } else {
                // Try to extract useful error message
                const errMsg = err.response?.data?.detail || "Analysis interrupted. Please try again.";
                setError(errMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex flex-col w-full bg-black/40 border border-white/10 rounded-xl backdrop-blur-md overflow-hidden text-gray-100 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[600px]'}`}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="p-2 bg-gradient-to-br from-purple-500/30 to-blue-500/10 rounded-lg border border-white/5 shadow-lg shadow-purple-900/20">
                    <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                </div>
                <div>
                    <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white text-lg">Agentic Intelligence</h3>
                    <p className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold">Strategic Operator Mode</p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {error && (
                        <div className="flex items-center gap-2 text-red-300 text-xs bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 mr-2">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                        </div>
                    )}
                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title={isFullScreen ? "Minimize" : "Maximize"}
                    >
                        {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-gradient-to-b from-transparent to-black/20">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === "assistant" ? "bg-gradient-to-br from-purple-600 to-indigo-700" : "bg-gray-700"
                            }`}>
                            {msg.role === "assistant" ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-gray-300" />}
                        </div>

                        <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                            <div className={`px-5 py-4 rounded-2xl shadow-sm ${msg.role === "assistant"
                                ? "bg-white/5 border border-white/5 text-gray-100 rounded-tl-none font-light"
                                : "bg-purple-600 text-white rounded-tr-none font-medium"
                                }`}>
                                {msg.role === "assistant" ? (
                                    <div className="agentic-response">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                )}
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1.5 px-1 font-mono opacity-60">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white/5 border border-white/5 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-sm">
                            <ContextLoader />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 md:p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="flex gap-3 max-w-4xl mx-auto w-full">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Ask for strategic analysis..."
                        disabled={isLoading || !conversationId}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder:text-gray-500 transition-all shadow-inner"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !conversationId || !input.trim()}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-700/40 hover:scale-105 active:scale-95"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Simple pulsing loader component
function ContextLoader() {
    return (
        <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
            <span className="text-xs text-purple-300/70 ml-2 font-medium">Analyzing market context...</span>
        </div>
    );
}
