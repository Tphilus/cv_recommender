import { useEffect, useState } from "react";
import { LuPlus, LuMic } from "react-icons/lu";

const THINKING_PHRASES = [
  "Reading your CV…",
  "Extracting your profile…",
  "Identifying your skills…",
  "Analysing your experience…",
  "Critiquing your CV…",
  "Matching roles for you…",
  "Almost there…",
];

interface AnalyzingScreenProps {
  filename: string;
}

export default function AnalyzingScreen({ filename }: AnalyzingScreenProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % THINKING_PHRASES.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-[20vh] justify-end">
      
      {/* Chat flow area */}
      <div className="flex w-full max-w-[720px] flex-col gap-10 mb-6">
        
        {/* User's uploaded file */}
        <div className="flex w-full justify-end">
          <div className="flex items-center gap-3 rounded-2xl border border-[#3f3f46] bg-[#27272A] px-4 py-3 shadow-lg max-w-[280px]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#3f3f46] text-[12px] font-bold uppercase text-[#ececec]">
              {filename.split(".").pop() ?? "CV"}
            </div>
            <span className="truncate text-[15px] font-medium text-[#ececec]">{filename}</span>
          </div>
        </div>

        {/* AI "Thinking" state */}
        <div className="flex w-full items-center gap-3 pl-2">
          <svg
            className="h-5 w-5 shrink-0 animate-spin text-[#3b82f6]"
            style={{ animationDuration: "2s" }}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <span
            className="text-[15px] font-medium text-[#ececec] transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {THINKING_PHRASES[phraseIndex]}
          </span>
        </div>

      </div>

      {/* Input bar */}
      <div className="flex w-full max-w-[720px] flex-col">
        <div className="relative flex min-h-[140px] w-full flex-col rounded-[24px] border border-[#3f3f46] bg-[#27272A] opacity-60">
          <div className="flex flex-1 flex-col justify-center px-4 py-4">
            <input
              type="text"
              disabled
              className="w-full bg-transparent text-[16px] text-[#ececec] placeholder:text-[#a1a1aa] outline-none cursor-not-allowed"
              placeholder="Analysing your CV…"
            />
          </div>
          <div className="flex items-center justify-between px-3 pb-3 mt-auto">
            <button disabled className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full text-[#ececec]">
              <LuPlus size={22} />
            </button>
            <div className="flex items-center gap-1">
              <div className="hidden cursor-not-allowed items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#ececec] sm:flex">
                CV Analyzer
              </div>
              <button disabled className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full text-[#ececec]">
                <LuMic size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
