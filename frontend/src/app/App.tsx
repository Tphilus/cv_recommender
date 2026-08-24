import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AnalyzingScreen from "@/components/AnalyzingScreen";
import ResultsScreen from "@/components/results/ResultsScreen";
import LoadingScreen from "@/components/ui/LoadingScreen";
import UploadScreen from "@/components/upload/UploadScreen";
import Sidebar from "@/components/history/Sidebar";
import SearchPage from "@/components/history/SearchPage";
import { candidateKeys } from "@/lib/api/queryKeys";
import { useCvAnalysisSession } from "@/lib/hooks/useCvAnalysisSession";
import { useDeleteCandidateMutation, useUploadCvMutation } from "@/lib/hooks/cvMutations";
import { useRecentCandidatesQuery } from "@/lib/hooks/useRecentCandidatesQuery";

export default function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // true = user just uploaded; false = restoring from URL on refresh
  const isNewUpload = useRef(false);
  const queryClient = useQueryClient();
  const { data: recents = [] } = useRecentCandidatesQuery();
  // nuqs keeps ?candidate=&file= in the URL — shareable & bookmarkable
  const [{ candidate: candidateId, file: uploadedFilename }, setSession] =
    useQueryStates({
      candidate: parseAsString.withDefault(""),
      file: parseAsString.withDefault(""),
    });
  const normalizedCandidateId = candidateId || null;

  const uploadMutation = useUploadCvMutation();
  const deleteMutation = useDeleteCandidateMutation();

  // A failed poll (stale/deleted candidate, network error) must also clear the
  // URL — otherwise the poisoned ?candidate=<id> re-triggers the same error on
  // every subsequent refresh. A confirmed-deleted candidate (404) must also drop
  // out of the DB-backed "recents" list, or that sidebar entry shows the same
  // error every time it's clicked, forever.
  const { status, results } = useCvAnalysisSession(normalizedCandidateId, {
    onClearSession: () => void setSession({ candidate: "", file: "" }),
    onCandidateNotFound: () => void queryClient.invalidateQueries({ queryKey: candidateKeys.list() }),
  });

  async function handleUpload(file: File) {
    isNewUpload.current = true;
    void setSession({ file: file.name });
    try {
      const { candidate_id } = await uploadMutation.mutateAsync(file);
      void setSession({ candidate: candidate_id, file: file.name });
    } catch (err) {
      isNewUpload.current = false;
      void setSession({ candidate: "", file: "" });
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as { detail?: string } | undefined)?.detail
        : undefined;
      if (detail) console.error(detail);
      toast.error("We couldn't upload your CV. Please try again.");
    }
  }

  function loadRecent(id: string) {
    const recent = recents.find((r) => r.candidateId === id);
    isNewUpload.current = false;
    void setSession({ candidate: id, file: recent?.filename ?? "CV" });
    setIsSearchOpen(false);
  }

  function reset() {
    void setSession({ candidate: "", file: "" });
    setIsSearchOpen(false);
  }

  function deleteRecent(id: string) {
    if (candidateId === id) {
      reset();
    }
    deleteMutation.mutate(id, {
      onError: () => {
        toast.error("Removed from your recents, but couldn't delete it from the server.");
      },
    });
  }

  // Cmd+K / Ctrl+K jumps to the search page.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        recents={recents}
        activeCandidateId={candidateId}
        onNewAnalysis={reset}
        onSelectRecent={loadRecent}
        onDeleteRecent={deleteRecent}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      <main className="flex flex-1 flex-col overflow-y-auto">
        {isSearchOpen && (
          <SearchPage
            recents={recents}
            onSelectRecent={loadRecent}
            onDeleteRecent={deleteRecent}
            onClose={() => setIsSearchOpen(false)}
          />
        )}

        {status === "idle" && (
          <UploadScreen onUpload={handleUpload} disabled={uploadMutation.isPending} />
        )}

        {status === "pending" &&
          (isNewUpload.current ? (
            <AnalyzingScreen filename={uploadedFilename || "your CV"} />
          ) : (
            <LoadingScreen />
          ))}

        {status === "done" && candidateId && results && (
          <div className="mx-auto w-full max-w-4xl px-5 pt-10 pb-20">
            <ResultsScreen
              candidateId={candidateId}
              filename={uploadedFilename}
              onStartOver={reset}
            />
          </div>
        )}
      </main>
    </div>
  );
}
