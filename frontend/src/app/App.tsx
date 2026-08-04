import axios from "axios";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteCandidate, uploadCv } from "@/api/client";
import LoadingScreen from "@/components/ui/LoadingScreen";
import AnalyzingScreen from "@/features/cv-analysis/components/AnalyzingScreen";
import ResultsScreen from "@/features/cv-analysis/components/results/ResultsScreen";
import UploadScreen from "@/features/cv-analysis/components/upload/UploadScreen";
import { usePollAnalysis } from "@/features/cv-analysis/hooks/usePollAnalysis";
import Sidebar from "@/features/history/components/Sidebar";
import SearchPage from "@/features/history/components/SearchPage";
import {
  addRecentAnalysis,
  getRecentAnalyses,
  removeRecentAnalysis,
  type RecentAnalysis,
} from "@/features/history/storage/recentAnalyses";

export default function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // true = user just uploaded; false = restoring from URL on refresh
  const isNewUpload = useRef(false);
  const [recents, setRecents] = useState<RecentAnalysis[]>(() =>
    getRecentAnalyses(),
  );
  // nuqs keeps ?candidate=&file= in the URL — shareable & bookmarkable
  const [{ candidate: candidateId, file: uploadedFilename }, setSession] =
    useQueryStates({
      candidate: parseAsString.withDefault(""),
      file: parseAsString.withDefault(""),
    });

  // A failed poll (stale/deleted candidate, network error) must also clear the
  // URL — otherwise the poisoned ?candidate=<id> re-triggers the same error on
  // every subsequent refresh. A confirmed-deleted candidate (404) must also be
  // dropped from the localStorage "recents" list, or that sidebar entry shows
  // the same error every time it's clicked, forever.
  const { status, results, startPolling, loadStoredAnalysis, clearResults, reportError } =
    usePollAnalysis({
      onClearSession: () => void setSession({ candidate: "", file: "" }),
      onCandidateNotFound: (id) => setRecents(removeRecentAnalysis(id)),
    });

  // Restore session from URL on first load
  useEffect(() => {
    if (candidateId) {
      startPolling(candidateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(file: File) {
    setIsUploading(true);
    isNewUpload.current = true;
    void setSession({ file: file.name });
    try {
      const { candidate_id } = await uploadCv(file);
      setRecents(
        addRecentAnalysis({
          candidateId: candidate_id,
          filename: file.name,
          uploadedAt: new Date().toISOString(),
        }),
      );
      void setSession({ candidate: candidate_id, file: file.name });
      startPolling(candidate_id);
    } catch (err) {
      isNewUpload.current = false;
      void setSession({ candidate: "", file: "" });
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as { detail?: string } | undefined)?.detail
        : undefined;
      reportError("We couldn't upload your CV. Please try again.", detail);
    } finally {
      setIsUploading(false);
    }
  }

  function loadRecent(id: string) {
    const recent = recents.find((r) => r.candidateId === id);
    isNewUpload.current = false;
    void setSession({ candidate: id, file: recent?.filename ?? "CV" });
    void loadStoredAnalysis(id);
    setIsSearchOpen(false);
  }

  function reset() {
    void setSession({ candidate: "", file: "" });
    clearResults();
    setIsSearchOpen(false);
  }

  function deleteRecent(id: string) {
    setRecents(removeRecentAnalysis(id));
    if (candidateId === id) {
      reset();
    }
    // Removing from localStorage is immediate for a snappy UI; the DB/S3 cleanup
    // happens in the background so a slow or failed request doesn't block it.
    void deleteCandidate(id).catch(() => {
      toast.error("Removed from your recents, but couldn't delete it from the server.");
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
          <UploadScreen onUpload={handleUpload} disabled={isUploading} />
        )}

        {(status === "polling" || status === "loading") &&
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
              profile={results.profile}
              improvements={results.improvements}
              jobs={results.jobs}
              onStartOver={reset}
            />
          </div>
        )}
      </main>
    </div>
  );
}
