export default function JobMatchSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-1 rounded-2xl border border-[#3f3f46] bg-[#27272A] p-4">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div className="h-5 w-48 rounded bg-[#3f3f46]" />
            <div className="h-6 w-20 rounded-full bg-[#3f3f46]" />
          </div>
          
          <div className="mt-1 flex flex-col gap-2">
            <div className="h-4 w-full rounded bg-[#3f3f46]" />
            <div className="h-4 w-5/6 rounded bg-[#3f3f46]" />
            <div className="h-4 w-4/6 rounded bg-[#3f3f46]" />
          </div>
          
          <div className="mt-4 flex gap-4">
            <div className="h-4 w-16 rounded bg-[#3f3f46]" />
            <div className="h-4 w-16 rounded bg-[#3f3f46]" />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <div className="h-3 w-16 rounded bg-[#3f3f46]" />
            <div className="flex gap-2">
              <div className="h-6 w-32 rounded-full bg-[#3f3f46]" />
              <div className="h-6 w-40 rounded-full bg-[#3f3f46]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
