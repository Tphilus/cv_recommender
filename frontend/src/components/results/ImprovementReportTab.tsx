import ScoreRing from "@/components/ui/ScoreRing";
import type { ImprovementReport } from "@/lib/api/types";

export default function ImprovementReportTab({ report }: { report: ImprovementReport }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <ScoreRing score={report.overall_score} size={80} />
        <div>
          <p className="font-semibold text-foreground">Overall Score</p>
          <p className="text-sm text-muted-foreground">out of 100</p>
        </div>
      </div>

      {report.strengths.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-foreground">Strengths</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">
            {report.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-base font-semibold text-foreground">Suggested Improvements</h3>
        {report.improvements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No specific issues flagged.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {report.improvements.map((imp, i) => (
              <div key={i} className="flex flex-col gap-1 rounded-2xl border border-[#3f3f46] bg-[#27272A] p-4 transition-colors hover:border-[#52525b]">
                <div className="flex items-center justify-between">
                  <strong className="text-[15px] font-semibold text-white">{imp.section}</strong>
                  <span className="rounded-full border border-[#3f3f46] px-2.5 py-0.5 text-xs font-medium text-[#ececec] capitalize">
                    {imp.priority}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#a1a1aa]">{imp.issue}</p>
                <p className="mt-1 text-sm text-[#ececec]">{imp.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
