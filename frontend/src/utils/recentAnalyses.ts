export interface RecentAnalysis {
  candidateId: string;
  filename: string;
  uploadedAt: string;
}

const STORAGE_KEY = "cv-recommender:recent-analyses";
const MAX_RECENTS = 10;

export function getRecentAnalyses(): RecentAnalysis[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentAnalysis[]) : [];
  } catch {
    return [];
  }
}

export function addRecentAnalysis(entry: RecentAnalysis): RecentAnalysis[] {
  const deduped = getRecentAnalyses().filter((r) => r.candidateId !== entry.candidateId);
  const updated = [entry, ...deduped].slice(0, MAX_RECENTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function removeRecentAnalysis(candidateId: string): RecentAnalysis[] {
  const updated = getRecentAnalyses().filter((r) => r.candidateId !== candidateId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
