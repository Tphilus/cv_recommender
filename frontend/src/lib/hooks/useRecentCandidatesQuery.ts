import { useQuery } from "@tanstack/react-query";
import { listCandidates } from "../api/cvApi";
import { candidateKeys } from "../api/queryKeys";
import type { Candidate } from "../api/types";

export interface RecentAnalysis {
  candidateId: string;
  filename: string;
  uploadedAt: string;
}

function toRecentAnalysis(candidate: Candidate): RecentAnalysis {
  return {
    candidateId: candidate._id,
    filename: candidate.original_filename,
    uploadedAt: candidate.uploaded_at,
  };
}

/** Sidebar/search "Recents" list — sourced from the DB instead of localStorage. */
export function useRecentCandidatesQuery() {
  return useQuery({
    queryKey: candidateKeys.list(),
    queryFn: () => listCandidates(),
    select: (candidates) => candidates.map(toRecentAnalysis),
  });
}
