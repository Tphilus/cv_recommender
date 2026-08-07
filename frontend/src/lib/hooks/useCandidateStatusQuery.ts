import { useQuery } from "@tanstack/react-query";
import { getCandidate } from "../api/cvApi";
import { candidateKeys } from "../api/queryKeys";

const POLL_INTERVAL_MS = 2000;

/** Polls GET /cv/{id} every 2s while the candidate is still processing; stops on analyzed/failed. */
export function useCandidateStatusQuery(candidateId: string | null) {
  return useQuery({
    queryKey: candidateKeys.detail(candidateId ?? ""),
    queryFn: () => getCandidate(candidateId as string),
    enabled: candidateId !== null,
    refetchInterval: (query) => (query.state.data?.status === "processing" ? POLL_INTERVAL_MS : false),
  });
}
