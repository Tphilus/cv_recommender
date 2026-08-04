import { useRef, useState } from "react";
import { LuArrowUp, LuChevronDown, LuMic, LuPaperclip, LuPlus, LuBriefcase } from "react-icons/lu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AttachmentPreviewCard from "./AttachmentPreviewCard";
import FilePreviewDialog from "./FilePreviewDialog";

interface UploadScreenProps {
  onUpload: (file: File) => void;
  disabled: boolean;
}

// Google Drive triangle icon
function DriveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 22h20L12 2z" />
      <path d="M12 2v20" />
      <path d="M2 22h10" />
    </svg>
  );
}



// Audio wave icon
function AudioWaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10v4" />
      <path d="M9 3v18" />
      <path d="M14 7v10" />
      <path d="M19 11v2" />
    </svg>
  );
}

export default function UploadScreen({ onUpload, disabled }: UploadScreenProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) setStagedFile(file);
  }

  function handleSend() {
    if (stagedFile && !disabled) onUpload(stagedFile);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pt-10 pb-[20vh] text-center">
      
      <div className="mb-10 flex items-center justify-center gap-4">
        <LuBriefcase size={28} className="text-[#3b82f6]" />
        <h1 className="font-serif text-[2.5rem] font-medium tracking-tight text-white">
          Hello, Theophilus
        </h1>
      </div>

      <div className="flex w-full max-w-[720px] flex-col gap-3">
        <div
          className={`relative flex min-h-[140px] w-full flex-col rounded-[24px] border transition-all ${
            isDragOver ? "border-[#3b82f6] bg-[#27272A]" : "border-[#3f3f46] bg-[#27272A] hover:border-[#52525b]"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (!disabled) handleFiles(e.dataTransfer.files);
          }}
        >
          
          {stagedFile && (
            <div className="flex px-4 pt-4">
              <AttachmentPreviewCard
                file={stagedFile}
                onRemove={() => setStagedFile(null)}
                onClick={() => setPreviewOpen(true)}
                disabled={disabled}
              />
            </div>
          )}

          <div className="flex flex-1 flex-col justify-center px-4 py-4">
            <input
              type="text"
              className="w-full bg-transparent text-[16px] text-[#ececec] placeholder:text-[#a1a1aa] outline-none"
              placeholder={stagedFile ? "How can I help you today?" : "Upload your CV to begin..."}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between px-3 pb-3 mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button disabled={disabled} title="Attach" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#ececec] hover:bg-[#3f3f46] transition-colors">
                  <LuPlus size={22} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-[#27272A] border-[#3f3f46] text-[#ececec]">
                <DropdownMenuItem onClick={() => inputRef.current?.click()} className="hover:bg-[#3f3f46] cursor-pointer">
                  <LuPaperclip size={18} className="mr-2" />
                  Upload files
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-[#3f3f46] cursor-pointer">
                  <span className="mr-2"><DriveIcon /></span>
                  Add from Drive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,image/*" hidden disabled={disabled} onChange={(e) => handleFiles(e.target.files)} />

            <div className="flex items-center gap-1">
              <div className="hidden cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#ececec] transition-colors hover:bg-[#3f3f46] sm:flex">
                CV Analyzer <LuChevronDown size={14} className="text-[#a1a1aa]" />
              </div>
              <button type="button" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#ececec] hover:bg-[#3f3f46] transition-colors">
                <LuMic size={18} />
              </button>
              
              {stagedFile ? (
                <button 
                  type="button" 
                  className="ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors" 
                  onClick={handleSend} 
                  disabled={disabled} 
                  title="Send"
                >
                  <LuArrowUp size={18} />
                </button>
              ) : (
                <button type="button" className="ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#ececec] hover:bg-[#3f3f46] transition-colors">
                  <AudioWaveIcon />
                </button>
              )}
            </div>
          </div>
        </div>
        {isDragOver && <p className="text-sm text-[#3b82f6]">Drop your CV here</p>}
      </div>

      <FilePreviewDialog file={stagedFile} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
