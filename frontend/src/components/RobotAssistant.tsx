"use client";
import { motion, Variants } from "framer-motion";

interface RobotProps {
  status: "idle" | "listening" | "thinking" | "speaking";
}

export default function RobotAssistant({ status }: RobotProps) {
  // Floating animation
  const mainVariants: Variants = {
    idle: { 
      y: [0, -4, 0], 
      transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } 
    },
    speaking: { 
      y: [0, -2, 0], 
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } 
    },
    thinking: { 
      rotate: [0, 5, -5, 0],
      transition: { repeat: Infinity, duration: 1, ease: "linear" } 
    },
    listening: {
        scale: [1, 1.05, 1],
        transition: { repeat: Infinity, duration: 2 }
    }
  };

  const eyeVariants: Variants = {
    idle: { 
        scaleY: [1, 1, 0.1, 1, 1], 
        transition: { repeat: Infinity, duration: 5, times: [0, 0.8, 0.85, 0.9, 1] } 
    },
    thinking: { scaleY: 0.3, transition: { repeat: Infinity, duration: 0.5 } },
    speaking: { scaleY: 1 },
  };

  const wheelVariants: Variants = {
    idle: { rotate: [0, 360], transition: { repeat: Infinity, duration: 8, ease: "linear" } },
    thinking: { rotate: [0, 360], transition: { repeat: Infinity, duration: 2, ease: "linear" } },
    speaking: { rotate: [0, 360], transition: { repeat: Infinity, duration: 4, ease: "linear" } },
  };

  return (
    <motion.div 
      variants={mainVariants} 
      animate={status} 
      initial="idle" 
      className="relative w-20 h-28 flex flex-col items-center justify-end origin-bottom"
    >
      {/* Head */}
      <div className="absolute top-0 flex flex-col items-center z-10">
          <div className="w-1 h-3 bg-slate-500 rounded-t-full relative">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 absolute -top-1.5 -left-0.75 shadow-[0_0_8px_rgba(96,165,250,1)]"/>
          </div>
          <div className="w-12 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-t-2xl rounded-b-md border border-slate-500 p-1.5 flex items-center justify-center shadow-lg">
             <div className="w-full h-full bg-slate-950 rounded-lg flex items-center justify-center space-x-2 relative border border-slate-700">
                <motion.div variants={eyeVariants} animate={status} className="w-2.5 h-4 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                <motion.div variants={eyeVariants} animate={status} className="w-2.5 h-4 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
             </div>
          </div>
      </div>

      {/* Body */}
      <div className="w-16 h-14 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-sm rounded-b-xl border border-slate-600 relative flex flex-col items-center p-1.5 z-0 shadow-inner">
         <div className="w-full h-full bg-slate-950/50 rounded-md flex items-center justify-center">
            <motion.div 
               animate={status === 'speaking' ? {opacity: [0.5, 1, 0.5]} : {opacity: 1}}
               transition={{repeat: Infinity, duration: 1}}
               className="w-3 h-3 rounded-full bg-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.7)]"
            />
         </div>
         <div className="absolute -left-2 top-3 w-2 h-7 bg-slate-600 rounded-l-md border border-slate-500" />
         <div className="absolute -right-2 top-3 w-2 h-7 bg-slate-600 rounded-r-md border border-slate-500" />
      </div>

      {/* Base */}
      <div className="w-14 h-4 bg-slate-800 rounded-t-sm rounded-b-md border-t border-slate-700 -mt-1 z-10 flex justify-between px-1 items-center">
        {[...Array(3)].map((_, i) => (
            <motion.div key={i} variants={wheelVariants} animate={status} className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-600 flex items-center justify-center">
                <div className="w-0.5 h-2 bg-slate-700 rotate-45 rounded-full" />
                <div className="w-0.5 h-2 bg-slate-700 -rotate-45 rounded-full absolute" />
            </motion.div>
        ))}
      </div>

      <motion.div 
        animate={{ scale: [1, 0.9, 1], opacity: [0.3, 0.15, 0.3] }} 
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="w-16 h-1.5 bg-black/40 rounded-[100%] filter blur-[2px] absolute -bottom-2 z-0" 
      />
    </motion.div>
  );
}