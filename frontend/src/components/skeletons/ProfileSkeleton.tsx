export default function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-56 rounded bg-[#3f3f46]" />
        <div className="h-4 w-72 rounded bg-[#3f3f46]" />
        <div className="h-4 w-48 rounded bg-[#3f3f46]" />
        <div className="h-6 w-36 rounded-full bg-[#3f3f46]" />
      </div>

      {/* Skills */}
      <div>
        <div className="mb-3 h-5 w-20 rounded bg-[#3f3f46]" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-6 w-24 rounded-full bg-[#3f3f46]" />
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <div className="mb-3 h-5 w-28 rounded bg-[#3f3f46]" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-2xl border border-[#3f3f46] bg-[#27272A] p-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-56 rounded bg-[#3f3f46]" />
                <div className="h-4 w-20 rounded bg-[#3f3f46]" />
              </div>
              <div className="h-4 w-full rounded bg-[#3f3f46]" />
              <div className="h-4 w-5/6 rounded bg-[#3f3f46]" />
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div>
        <div className="mb-3 h-5 w-24 rounded bg-[#3f3f46]" />
        <div className="flex flex-col gap-3">
          {[1].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-2xl border border-[#3f3f46] bg-[#27272A] p-4">
              <div className="h-5 w-64 rounded bg-[#3f3f46]" />
              <div className="h-4 w-40 rounded bg-[#3f3f46]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
