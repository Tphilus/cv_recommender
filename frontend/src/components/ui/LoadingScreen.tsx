export default function LoadingScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3f3f46] border-t-[#3b82f6]" />
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-lg font-medium text-white">Loading results</h2>
        <p className="text-sm text-[#a1a1aa]">Please wait while we prepare your dashboard.</p>
      </div>
    </div>
  );
}
