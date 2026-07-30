import axios from "axios";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { uploadCv } from "./api/client";
import Sidebar from "./components/layout/Sidebar";
import ResultsScreen from "./components/results/ResultsScreen";
import SearchPage from "./components/search/SearchPage";
import LoadingScreen from "./components/ui/LoadingScreen";
import AnalyzingScreen from "./components/upload/AnalyzingScreen";
import UploadScreen from "./components/upload/UploadScreen";
// import { usePollAnalysis } from "./hooks/usePollAnalysis";
import { usePollAnalysis } from "./components/ui/usePollAnalysis";
import {
  addRecentAnalysis,
  getRecentAnalyses,
  removeRecentAnalysis,
  type RecentAnalysis,
} from "./utils/recentAnalyses";

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
  // every subsequent refresh.
  const { status, results, startPolling, clearResults, reportError } =
    usePollAnalysis(() => void setSession({ candidate: "", file: "" }));

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
    void setSession({ candidate: id, file: recent?.filename ?? "CV" });
    startPolling(id);
    setIsSearchOpen(false);
  }

  function reset() {
    void setSession({ candidate: "", file: "" });
    clearResults();
    setIsSearchOpen(false);
  }

  function deleteRecent(id: string) {
    setRecents(removeRecentAnalysis(id));
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

        {status === "polling" &&
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
              onStartOver={reset}
            />
          </div>
        )}
      </main>
    </div>
  );
}
