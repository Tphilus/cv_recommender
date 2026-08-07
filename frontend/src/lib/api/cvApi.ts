import { httpClient } from "./httpClient";
import type { AnalysisResponse, Candidate, JobMatchReport, UploadResponse } from "./types";

export async function uploadCv(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await httpClient.post<UploadResponse>("/cv/upload", formData);
  return data;
}

export async function getCandidate(candidateId: string): Promise<Candidate> {
  const { data } = await httpClient.get<Candidate>(`/cv/${candidateId}`);
  return data;
}

export async function listCandidates(limit = 50): Promise<Candidate[]> {
  const { data } = await httpClient.get<Candidate[]>("/cv", { params: { limit } });
  return data;
}

export async function getAnalysis(candidateId: string): Promise<AnalysisResponse> {
  const { data } = await httpClient.get<AnalysisResponse>(`/cv/${candidateId}/analysis`);
  return data;
}

export async function getJobRecommendations(candidateId: string): Promise<JobMatchReport> {
  const { data } = await httpClient.post<JobMatchReport>("/jobs/recommendations", {
    candidate_id: candidateId,
  });
  return data;
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  await httpClient.delete(`/cv/${candidateId}`);
}

export async function fetchCvPreviewBlob(candidateId: string): Promise<Blob> {
  // Goes through the shared axios instance (not a raw fetch()) so the x-api-key
  // header attaches automatically and the request stays same-origin-safe — the
  // backend proxies the file from storage instead of handing back a direct S3
  // URL, since S3 has no CORS policy configured for browser fetches.
  const { data } = await httpClient.get<Blob>(`/cv/${candidateId}/preview-file`, { responseType: "blob" });
  return data;
}
