import type { JobMatchReport } from "@/lib/api/types";

export default function JobMatchesTab({ report }: { report: JobMatchReport }) {
  const matches = report.matches;

  if (matches.length === 0) {
    return <p className="text-sm text-muted-foreground">No job matches found.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {matches.map((match, i) => (
        <div key={i} className="flex flex-col gap-1 rounded-2xl border border-[#3f3f46] bg-[#27272A] p-4 transition-colors hover:border-[#52525b]">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <strong className="text-[15px] font-semibold text-white">{match.job_title}</strong>
              <span className="rounded-full bg-[#3b82f6]/10 px-2.5 py-0.5 text-xs font-medium text-[#3b82f6]">
                {match.match_score}% match
              </span>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-[#a1a1aa]">{match.reasoning}</p>

            {match.apply_links.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-4">
                {match.apply_links.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#3b82f6] hover:text-[#2563eb] transition-colors">
                    Apply ↗
                  </a>
                ))}
              </div>
            )}

            {match.skill_gaps.length > 0 && (
              <div className="mt-1">
                <p className="mb-2 text-xs text-[#a1a1aa]">Skill gaps:</p>
                <div className="flex flex-wrap gap-2">
                  {match.skill_gaps.map((gap) => (
                    <a key={gap.skill} href={gap.resource_url} target="_blank" rel="noreferrer" className="no-underline">
                      <span className="rounded-full border border-[#3f3f46] px-3 py-1 text-[13px] text-[#ececec] transition-colors hover:bg-[#3f3f46]">
                        {gap.skill} → {gap.resource_name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
