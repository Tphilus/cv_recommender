import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getAnalysis, getCandidate } from "@/api/client";
import type { ExtractedCV, ImprovementReport, JobMatchReport } from "@/api/types";

const POLL_INTERVAL_MS = 2000;

type PollStatus = "idle" | "loading" | "polling" | "done";

interface UsePollAnalysisReturn {
  status: PollStatus;
  results: AnalysisResults | null;
  startPolling: (candidateId: string) => void;
  loadStoredAnalysis: (candidateId: string) => Promise<void>;
  clearResults: () => void;
  /** Shows a short, user-safe toast; any technical detail is logged to the console, never shown in the UI. */
  reportError: (userMessage: string, debugDetail?: string) => void;
}

interface AnalysisResults {
  profile: ExtractedCV;
  improvements: ImprovementReport;
  jobs: JobMatchReport;
}

interface UsePollAnalysisOptions {
  /** Called whenever a failure resets the active session — clears the ?candidate= URL param. */
  onClearSession?: () => void;
  /** Called specifically when the backend says a candidate no longer exists (404) — the
   * caller should drop it from any local "recents" list too, or the same dead entry
   * shows this exact error every time it's clicked, forever. */
  onCandidateNotFound?: (candidateId: string) => void;
}

function isNotFound(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

export function usePollAnalysis(
  options: UsePollAnalysisOptions = {},
): UsePollAnalysisReturn {
  const { onClearSession, onCandidateNotFound } = options;
  const [status, setStatus] = useState<PollStatus>("idle");
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const pollTimer = useRef<number | undefined>(undefined);
  const onClearSessionRef = useRef(onClearSession);
  onClearSessionRef.current = onClearSession;
  const onCandidateNotFoundRef = useRef(onCandidateNotFound);
  onCandidateNotFoundRef.current = onCandidateNotFound;

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

  async function loadStoredAnalysis(id: string) {
    clearInterval(pollTimer.current);
    setCandidateId(id);
    setResults(null);
    setStatus("loading");

    try {
      const analysis = await getAnalysis(id);
      if (
        analysis.status === "analyzed" &&
        analysis.extracted_profile &&
        analysis.improvements &&
        analysis.job_matches
      ) {
        setResults({
          profile: analysis.extracted_profile,
          improvements: analysis.improvements,
          jobs: analysis.job_matches,
        });
        setStatus("done");
        return;
      }

      if (analysis.status === "failed") {
        reportError("We couldn't load this saved analysis.");
        return;
      }

      // A recent item may be clicked while its original upload is still being
      // processed. Poll its database status; this never starts a new pipeline.
      startPolling(id);
    } catch (err) {
      if (isNotFound(err)) {
        onCandidateNotFoundRef.current?.(id);
        reportError("This analysis no longer exists — it may have been deleted.");
      } else {
        reportError("We couldn't load this saved analysis from the database.");
      }
    }
  }

  const reportError = useCallback((userMessage: string, debugDetail?: string) => {
    if (debugDetail) console.error(debugDetail);
    toast.error(userMessage);
    setStatus("idle");
    setResults(null);
    setCandidateId(null);
    clearInterval(pollTimer.current);
    onClearSessionRef.current?.();
  }, []);

  useEffect(() => {
    if (status !== "polling" || !candidateId) return;

    async function poll() {
      if (!candidateId) return;
      try {
        const candidate = await getCandidate(candidateId);
        if (candidate.status === "analyzed") {
          const analysis = await getAnalysis(candidateId);

          if (analysis.extracted_profile && analysis.improvements && analysis.job_matches) {
            setResults({
              profile: analysis.extracted_profile,
              improvements: analysis.improvements,
              jobs: analysis.job_matches,
            });
            setStatus("done");
          }
        } else if (candidate.status === "failed") {
          reportError(
            "We couldn't analyze this CV. Please try a different file.",
            candidate.error_detail ?? undefined,
          );
        }
      } catch (err) {
        if (isNotFound(err)) {
          onCandidateNotFoundRef.current?.(candidateId);
          reportError("This analysis no longer exists — it may have been deleted.");
        } else {
          reportError("Lost connection to the backend while checking status.");
        }
      }
    }

    poll();
    pollTimer.current = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(pollTimer.current);
  }, [status, candidateId, reportError]);

  return { status, results, startPolling, loadStoredAnalysis, clearResults, reportError };
}
