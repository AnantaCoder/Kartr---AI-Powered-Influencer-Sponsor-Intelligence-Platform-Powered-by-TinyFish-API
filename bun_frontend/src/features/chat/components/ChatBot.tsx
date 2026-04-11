import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { sendChatMessage, addUserMessage } from "../../../store/slices/chatSlice"
import type { RootState, AppDispatch } from "../../../store/store"

const ChatBox = () => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")

  const bottomRef = useRef<HTMLDivElement | null>(null)

  const dispatch = useDispatch<AppDispatch>()
  const { messages, loading } = useSelector(
    (state: RootState) => state.chat
  )

  // Streaming effect state
  const [streamedMsg, setStreamedMsg] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // Find the last assistant message
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastMsg && lastMsg.role === "assistant" && lastMsg.content && !isStreaming) {
      setIsStreaming(true);
      setStreamedMsg("");
      let i = 0;
      const interval = setInterval(() => {
        setStreamedMsg(lastMsg.content.slice(0, i + 1));
        i++;
        if (i >= lastMsg.content.length) {
          clearInterval(interval);
          setIsStreaming(false);
        }
      }, 18); // Speed of streaming
      return () => clearInterval(interval);
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const handleSend = () => {
    if (!input.trim()) return

    dispatch(addUserMessage(input))
    dispatch(sendChatMessage(input))
    .unwrap()
  .then(res => console.log("AI:", res))
  .catch(err => console.error("AI ERROR:", err))
    setInput("")
  }

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-6 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:scale-105 transition"
      >
        <MessageCircle />
      </button>

      {/* CHAT PANEL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] rounded-2xl bg-white shadow-2xl border overflow-hidden"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-white">
              <div>
                <p className="font-semibold">Analytics Assistant</p>
                <p className="text-xs opacity-90">
                  Ask about YouTube insights
                </p>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* MESSAGES */}
            <div className="h-[260px] space-y-3 overflow-y-auto px-4 py-3 text-sm">
              {messages.map((msg, idx) => {
                const formatDate = (dateStr?: string) => {
                  if (!dateStr) return '';
                  const d = new Date(dateStr);
                  return d.toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  });
                };
                // If last message and assistant, show streaming
                const isLastAssistant = idx === messages.length - 1 && msg.role === "assistant" && isStreaming;
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 flex flex-col ${
                      msg.role === "assistant"
                        ? "bg-gray-100 text-gray-800"
                        : "ml-auto bg-indigo-500 text-white"
                    }`}
                  >
                    <span>{isLastAssistant ? streamedMsg : msg.content}</span>
                    {msg.created_at && (
                      <span className={`mt-1 text-xs text-gray-400 ${msg.role === "assistant" ? "self-end" : "self-start"}`}>{formatDate(msg.created_at)}</span>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="max-w-[60%] rounded-lg bg-gray-100 px-3 py-2 text-gray-400 italic">
                  Typing…
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="flex items-center gap-2 border-t px-3 py-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask something..."
                className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 text-black font-bold"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="rounded-md bg-indigo-500 p-2 text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatBox
