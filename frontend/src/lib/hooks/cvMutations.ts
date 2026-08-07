import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCandidate, fetchCvPreviewBlob, uploadCv } from "../api/cvApi";
import { candidateKeys } from "../api/queryKeys";
import type { Candidate } from "../api/types";

export function useUploadCvMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadCv,
    onSuccess: () => {
      // The new candidate now exists in the DB — refetch the sidebar list so it shows up.
      void queryClient.invalidateQueries({ queryKey: candidateKeys.list() });
    },
  });
}

export function useDeleteCandidateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCandidate,
    onMutate: async (candidateId) => {
      // Optimistically drop it from the sidebar list for a snappy UI — the
      // DB/S3 cleanup happens in the background so a slow request doesn't block it.
      await queryClient.cancelQueries({ queryKey: candidateKeys.list() });
      queryClient.setQueryData<Candidate[]>(candidateKeys.list(), (old) =>
        old?.filter((c) => c._id !== candidateId),
      );
    },
    onSettled: (_data, _error, candidateId) => {
      // Drop the cache entry regardless of outcome so a deleted candidate can't
      // keep being polled from a stale query, then resync the list with the
      // server — this also restores the optimistic removal if the delete failed.
      queryClient.removeQueries({ queryKey: candidateKeys.detail(candidateId) });
      void queryClient.invalidateQueries({ queryKey: candidateKeys.list() });
    },
  });
}

export function useCvPreviewMutation() {
  return useMutation({
    mutationFn: fetchCvPreviewBlob,
  });
}
