"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, GraduationCap, Info, HelpCircle, Bot } from "lucide-react";
import Image from "next/image"; 
import RobotAssistant from "@/components/RobotAssistant";
import ChatMessage from "@/components/ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { label: "BCA Fees", icon: GraduationCap, query: "What is the fee for BCA?" },
  { label: "MCA Eligibility", icon: Info, query: "What is the eligibility for MCA?" },
  { label: "Admission Process", icon: HelpCircle, query: "Describe the admission process." },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am DCA-IntelliBot. How can I help you today regarding Computer Application admissions, eligibility, or fees?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error("Network Error");
      
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: "Oops! I couldn't reach the server. Make sure the backend API is running." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  let robotStatus: "idle" | "listening" | "thinking" | "speaking" = "idle";
  if (isLoading) robotStatus = "thinking";
  else if (isTyping) robotStatus = "listening";

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-2 sm:p-4 lg:p-8 font-sans selection:bg-cyan-500/30 text-slate-100">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/15 blur-[120px]" />
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 relative z-10 h-[96vh] lg:h-[94vh]">
        
        {/* Left Panel: Branding & Robot (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col items-center bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:40px_40px]"></div>

           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.6 }}
             className="relative z-10 flex flex-col items-center text-center space-y-8 w-full h-full"
           >
              {/* Top Section: Gol University Logos */}
              <div className="flex w-full items-center justify-between px-4 gap-6">
                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center p-1.5 border-4 border-slate-700/50 overflow-hidden">
                  <Image src="/csjmu.png" alt="CSJMU Logo" width={60} height={60} className="object-contain" />
                </div>
                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center p-1 border-4 border-slate-700/50 overflow-hidden">
                  <Image src="/Nacc_logo.png" alt="NAAC Logo" width={70} height={70} className="object-contain" />
                </div>
              </div>

              {/* Middle Section: Robot */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-5 w-full">
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-950 rounded-full border border-slate-700 shadow-2xl flex items-center justify-center relative">
                   <RobotAssistant status={robotStatus} />
                </div>
                <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 tracking-tight">
                  DCA-IntelliBot
                </h1>
              </div>
              
              {/* Bottom Section: Text */}
              <div className="space-y-4 pt-6 border-t border-white/5 w-full">
                  <h2 className="text-lg font-bold text-slate-200 tracking-wide">
                    Welcome to Department of Computer Application
                  </h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Need details about MCA/BCA fees, eligibility, or admission process? Use the quick suggestions!
                </p>
              </div>
           </motion.div>
        </div>

        {/* Right Panel: Chat Interface */}
        <div className="col-span-1 lg:col-span-8 flex flex-col bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-3xl shadow-3xl overflow-hidden h-full">
          
          {/* MOBILE HEADER - YAHAN EDIT KIYA HAI */}
          <div className="lg:hidden flex items-center p-2 border-b border-white/5 bg-slate-950/90 backdrop-blur-md z-20 sticky top-0 gap-2">
             <div className="flex items-center gap-1.5 flex-shrink-0">
                 <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center p-0.5 border border-slate-700/50 overflow-hidden">
                    <Image src="/csjmu.png" alt="CSJMU Logo" width={24} height={24} className="object-contain" />
                 </div>
                 <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center p-0.5 border border-slate-700/50 overflow-hidden">
                    <Image src="/Nacc_logo.png" alt="NAAC Logo" width={28} height={28} className="object-contain" />
                 </div>
              </div>

              <div className="flex-1 flex items-center justify-end gap-2 overflow-hidden">
                 <div className="text-right">
                    <h1 className="text-xs font-bold text-white leading-tight">DCA-IntelliBot</h1>
                    <p className="text-[7px] text-cyan-400 font-medium uppercase tracking-tighter truncate">Dept. of Computer Application</p>
                 </div>
                 <div className="flex-shrink-0 scale-[0.5] origin-right w-10 h-14 bg-gradient-to-br from-slate-800 to-slate-950 rounded-full border border-slate-700 flex items-center justify-center overflow-visible">
                    <RobotAssistant status={robotStatus} />
                 </div>
              </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 scroll-smooth custom-scrollbar flex flex-col pt-5 lg:pt-8">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} role={msg.role} content={msg.content} />
              ))}
              
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-start my-3">
                  <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 px-4 py-3 rounded-xl rounded-bl-sm flex space-x-2 items-center shadow-lg">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 rounded-full bg-cyan-400" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 rounded-full bg-blue-400" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-5 bg-slate-950/60 border-t border-white/5 backdrop-blur-xl mt-auto">
            {messages.length < 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mb-4">
                {SUGGESTIONS.map((sug, i) => (
                  <button key={i} onClick={() => handleSend(sug.query)}
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] sm:text-xs text-slate-300 transition-all duration-300 whitespace-nowrap group hover:border-cyan-500/40 hover:text-cyan-100"
                  >
                    <sug.icon className="w-4 h-4 text-cyan-500/80" />
                    <span className="font-medium">{sug.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
            
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                placeholder="Ask about admissions..." disabled={isLoading}
                className="w-full bg-slate-900/60 border border-slate-700/60 text-slate-100 placeholder-slate-600 rounded-full pl-5 pr-14 py-3.5 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/20 text-sm disabled:opacity-60 shadow-inner"
              />
              <button type="submit" disabled={!input.trim() || isLoading}
                className="absolute right-1.5 p-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-full transition-all duration-300 disabled:opacity-0 disabled:scale-75 shadow-md flex items-center justify-center"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
        
      </div>
    </main>
  );
}