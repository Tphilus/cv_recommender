import axios from "axios";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ExtractedCV, ImprovementReport, JobMatchReport } from "../api/types";
import { useAnalysisQuery } from "./useAnalysisQuery";
import { useCandidateStatusQuery } from "./useCandidateStatusQuery";

export type SessionStatus = "idle" | "pending" | "done";

export interface AnalysisResults {
  profile: ExtractedCV;
  improvements: ImprovementReport;
  jobs: JobMatchReport;
}

interface UseCvAnalysisSessionOptions {
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

/**
 * Combines candidate-status polling + analysis fetching into one session, and
 * drives the toast/URL/recents side effects a failure needs. Replaces the old
 * hand-rolled usePollAnalysis setInterval loop.
 */
export function useCvAnalysisSession(
  candidateId: string | null,
  options: UseCvAnalysisSessionOptions = {},
) {
  const { onClearSession, onCandidateNotFound } = options;
  const candidateQuery = useCandidateStatusQuery(candidateId);
  const isAnalyzed = candidateQuery.data?.status === "analyzed";
  const analysisQuery = useAnalysisQuery(candidateId, isAnalyzed);

  // Guards against re-toasting/re-clearing for the same candidate on every re-render.
  const handledErrorForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;

    const failed = candidateQuery.data?.status === "failed";
    const error = candidateQuery.error ?? analysisQuery.error;
    if (!failed && !error) return;
    if (handledErrorForRef.current === candidateId) return;
    handledErrorForRef.current = candidateId;

    if (failed) {
      if (candidateQuery.data?.error_detail) console.error(candidateQuery.data.error_detail);
      toast.error("We couldn't analyze this CV. Please try a different file.");
    } else if (isNotFound(error)) {
      onCandidateNotFound?.(candidateId);
      toast.error("This analysis no longer exists — it may have been deleted.");
    } else {
      toast.error("Lost connection to the backend while checking status.");
    }
    onClearSession?.();
  }, [candidateId, candidateQuery.data, candidateQuery.error, analysisQuery.error, onCandidateNotFound, onClearSession]);

  const results: AnalysisResults | null =
    analysisQuery.data?.status === "analyzed" &&
    analysisQuery.data.extracted_profile &&
    analysisQuery.data.improvements &&
    analysisQuery.data.job_matches
      ? {
          profile: analysisQuery.data.extracted_profile,
          improvements: analysisQuery.data.improvements,
          jobs: analysisQuery.data.job_matches,
        }
      : null;

  let status: SessionStatus = "idle";
  if (candidateId && handledErrorForRef.current !== candidateId) {
    status = results ? "done" : "pending";
  }

  return { status, results };
}
