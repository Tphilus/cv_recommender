import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SidebarProps } from "@/types/api";
import { useState } from "react";
import {
  LuChevronsUpDown,
  LuDownload,
  LuLayers,
  LuPanelLeftClose,
  LuPlus,
  LuSearch,
  LuSlidersHorizontal,
  LuTrash2,
} from "react-icons/lu";

export default function Sidebar({
  recents,
  activeCandidateId,
  onNewAnalysis,
  onSelectRecent,
  onDeleteRecent,
  onSearchClick,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 0);
  };

  if (!isOpen) {
    return (
      <aside className="relative z-10 flex h-screen w-[68px] shrink-0 flex-col bg-[#18181A] text-[#a1a1aa] transition-all duration-300">
        {/* STICKY TOP AREA - COLLAPSED */}
        <div
          className={`flex flex-col items-center pb-4 pt-4 shrink-0 transition-colors ${isScrolled ? "border-b border-[#27272A]" : "border-b border-transparent"}`}
        >
          <button
            onClick={() => setIsOpen(true)}
            className="mb-6 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-[#27272A] hover:text-[#ececec] transition-colors"
            title="Expand sidebar"
          >
            <LuPanelLeftClose size={18} />
          </button>

          <button
            onClick={onNewAnalysis}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#27272A] text-[#ececec] hover:bg-[#3f3f46] transition-colors"
            title="New chat"
          >
            <LuPlus size={20} />
          </button>
        </div>

        {/* SCROLLABLE AREA - COLLAPSED */}
        <div
          className="custom-scrollbar flex flex-1 flex-col items-center overflow-y-auto py-4"
          onScroll={handleScroll}
        >
          <div className="flex w-full flex-col items-center gap-4">
            <button
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md hover:bg-[#27272A] hover:text-[#ececec] transition-colors"
              title="Projects"
            >
              <LuLayers size={20} />
            </button>
          </div>
        </div>

        {/* BOTTOM USER AREA - COLLAPSED */}
        <div className="flex flex-col items-center border-t border-[#27272A] pb-4 pt-3 shrink-0">
          <button
            className="mb-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-[#27272A] hover:text-[#ececec] transition-colors"
            title="Download"
          >
            <LuDownload size={18} />
          </button>
          <button
            className="cursor-pointer transition-opacity hover:opacity-80"
            title="Profile"
          >
            <Avatar className="h-10 w-10 bg-[#e5e5e5]">
              <AvatarFallback className="bg-[#e5e5e5] text-sm font-medium text-black">
                TK
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative z-10 flex h-screen w-72 shrink-0 flex-col bg-[#18181A] text-[#ececec] transition-all duration-300">
      {/* STICKY TOP AREA */}
      <div
        className={`flex flex-col px-3 pt-4 pb-3 shrink-0 transition-colors ${isScrolled ? "border-b border-[#27272A]" : "border-b border-transparent"}`}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between px-2">
          <span className="font-serif text-2xl font-medium tracking-tight text-white">
            Elevate
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onSearchClick}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-[#27272A] transition-colors"
            >
              <LuSearch size={18} className="text-[#a1a1aa]" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-[#27272A] transition-colors"
            >
              <LuPanelLeftClose size={18} className="text-[#a1a1aa]" />
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewAnalysis}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[#27272A]"
        >
          <LuPlus size={18} className="text-[#a1a1aa]" />
          <span>New chat</span>
        </button>
      </div>

      {/* SCROLLABLE AREA */}
      <div
        className="custom-scrollbar flex flex-1 flex-col overflow-y-auto px-3 py-4"
        onScroll={handleScroll}
      >
        {/* Main Nav */}
        <div className="flex flex-col gap-0.5">
          <button className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[#27272A]">
            <LuLayers size={18} className="text-[#a1a1aa]" />
            <span>Projects</span>
          </button>
        </div>

        {/* Recents Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-[#71717a]">Recents</span>
            <button className="flex cursor-pointer items-center justify-center text-[#71717a] hover:text-[#ececec]">
              <LuSlidersHorizontal size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-0.5 pb-20">
            {recents.map((r) => {
              const isActive = activeCandidateId === r.candidateId;
              return (
                <div
                  key={r.candidateId}
                  onClick={() => onSelectRecent(r.candidateId)}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                    isActive ? "bg-[#27272A]" : "hover:bg-[#27272A]"
                  }`}
                >
                  <span className="truncate pr-2">{r.filename}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecent(r.candidateId);
                    }}
                    className={`flex cursor-pointer items-center justify-center text-[#a1a1aa] hover:text-[#ef4444] transition-colors ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    title="Delete chat"
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom User Area */}
      <div className="absolute bottom-0 left-0 w-full border-t border-[#27272A] bg-[#18181A] p-3">
        <button className="flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-2 hover:bg-[#27272A] transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 bg-[#e5e5e5]">
              <AvatarFallback className="bg-[#e5e5e5] text-black font-medium">
                TK
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start overflow-hidden text-left">
              <span className="truncate text-sm font-medium">
                Theophilus K. Dadzie
              </span>
              <span className="text-xs text-[#71717a]">Pro plan</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[#a1a1aa]">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#3f3f46] hover:bg-[#3f3f46] transition-colors">
              <LuDownload size={14} />
            </div>
            <LuChevronsUpDown size={14} />
          </div>
        </button>
      </div>
    </aside>
  );
}
