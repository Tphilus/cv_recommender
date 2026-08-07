import { useQuery } from "@tanstack/react-query";
import { getAnalysis } from "../api/cvApi";
import { candidateKeys } from "../api/queryKeys";

/** GET /cv/{id}/analysis — only meaningful once the candidate's status is "analyzed". */
export function useAnalysisQuery(candidateId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: candidateKeys.analysis(candidateId ?? ""),
    queryFn: () => getAnalysis(candidateId as string),
    enabled: candidateId !== null && enabled,
  });
}
