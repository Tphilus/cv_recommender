import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
// import { getAnalysis, getCandidate } from "../api/client";
import { getAnalysis, getCandidate } from "@/api/client";
import type { ExtractedCV, ImprovementReport } from "@/types/api";
// import type { ExtractedCV, ImprovementReport } from "../types/api";

const POLL_INTERVAL_MS = 2000;

type PollStatus = "idle" | "polling" | "done";

interface UsePollAnalysisReturn {
  status: PollStatus;
  results: { profile: ExtractedCV; improvements: ImprovementReport } | null;
  startPolling: (candidateId: string) => void;
  clearResults: () => void;
  /** Shows a short, user-safe toast; any technical detail is logged to the console, never shown in the UI. */
  reportError: (userMessage: string, debugDetail?: string) => void;
}

export function usePollAnalysis(): UsePollAnalysisReturn {
  const [status, setStatus] = useState<PollStatus>("idle");
  const [results, setResults] = useState<{
    profile: ExtractedCV;
    improvements: ImprovementReport;
  } | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const pollTimer = useRef<number | undefined>(undefined);

  function startPolling(id: string) {
    setCandidateId(id);
    setResults(null);
    setStatus("polling");
  }

  function clearResults() {
    setStatus("idle");
    setResults(null);
    setCandidateId(null);
    clearInterval(pollTimer.current);
  }

  function reportError(userMessage: string, debugDetail?: string) {
    if (debugDetail) console.error(debugDetail);
    toast.error(userMessage);
    setStatus("idle");
    setResults(null);
    setCandidateId(null);
    clearInterval(pollTimer.current);
  }

  useEffect(() => {
    if (status !== "polling" || !candidateId) return;

    async function poll() {
      if (!candidateId) return;
      try {
        const candidate = await getCandidate(candidateId);
        if (candidate.status === "analyzed") {
          const analysis = await getAnalysis(candidateId);

          if (analysis.extracted_profile && analysis.improvements) {
            setResults({
              profile: analysis.extracted_profile,
              improvements: analysis.improvements,
            });
            setStatus("done");
          }
        } else if (candidate.status === "failed") {
          reportError(
            "We couldn't analyze this CV. Please try a different file.",
            candidate.error_detail ?? undefined,
          );
        }
      } catch {
        reportError("Lost connection to the backend while checking status.");
      }
    }

    poll();
    pollTimer.current = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(pollTimer.current);
  }, [status, candidateId]);

  return { status, results, startPolling, clearResults, reportError };
}
