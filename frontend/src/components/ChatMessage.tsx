"use client";
import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      className={`flex w-full my-4.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-[88%] sm:max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"} items-end gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8.5 h-8.5 rounded-full flex items-center justify-center shadow-lg border ${
            isUser ? "bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 border-indigo-400" : "bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600"
          }`}>
          {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-cyan-300" />}
        </div>
        
        {/* Bubble */}
        <div className={`px-5 py-3.5 shadow-xl ${
            isUser 
              ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-sm" 
              : "bg-white/85 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-sm"
          }`}
        >
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium">{content}</div>
        </div>
      </div>
    </motion.div>
  );
}