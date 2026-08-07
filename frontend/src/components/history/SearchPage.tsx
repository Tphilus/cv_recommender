import { LuSearch, LuX, LuMessageCircle } from "react-icons/lu";
import { Command as CommandPrimitive } from "cmdk";
import type { RecentAnalysis } from "@/lib/hooks/useRecentCandidatesQuery";
import { useEffect } from "react";

interface SearchPageProps {
  recents: RecentAnalysis[];
  onSelectRecent: (candidateId: string) => void;
  onDeleteRecent: (candidateId: string) => void;
  onClose: () => void;
}

export default function SearchPage({ recents, onSelectRecent, onClose }: SearchPageProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onClose]);

  const getTimeAgo = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]" onClick={onClose}>
      <CommandPrimitive 
        className="w-full max-w-180 rounded-2xl border border-[#3f3f46] bg-[#222222] shadow-2xl overflow-hidden text-[#ececec]" 
        onClick={(e) => e.stopPropagation()}
        shouldFilter
      >
        <div className="flex items-center border-b border-[#303030] px-4 py-1">
          <LuSearch className="mr-3 h-5 w-5 text-[#a1a1aa]" />
          <CommandPrimitive.Input 
            autoFocus
            className="flex h-12 w-full flex-1 bg-transparent text-[#ececec] outline-none placeholder:text-[#a1a1aa]"
            placeholder="Search chats and projects"
          />
          <button onClick={onClose} className="ml-3 cursor-pointer text-[#a1a1aa] hover:text-[#ececec]">
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <CommandPrimitive.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          <CommandPrimitive.Empty className="py-6 text-center text-sm text-[#a1a1aa]">
            No matching chats found.
          </CommandPrimitive.Empty>
          
          {recents.map((r) => (
            <CommandPrimitive.Item
              key={r.candidateId}
              value={r.filename}
              onSelect={() => onSelectRecent(r.candidateId)}
              className="group flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors hover:bg-[#303030]"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <LuMessageCircle className="h-5 w-5 shrink-0 text-[#a1a1aa]" />
                <span className="truncate text-[#ececec]">{r.filename}</span>
              </div>
              <span className="shrink-0 text-xs text-[#a1a1aa] ml-4">
                {getTimeAgo(r.uploadedAt)}
              </span>
            </CommandPrimitive.Item>
          ))}
        </CommandPrimitive.List>
      </CommandPrimitive>
    </div>
  );
}
