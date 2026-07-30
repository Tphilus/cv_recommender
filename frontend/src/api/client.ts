import axios from "axios";
import type { AnalysisResponse, Candidate, JobMatchReport, UploadResponse } from "../types/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "x-api-key": import.meta.env.VITE_API_KEY,
  },
});

export async function uploadCv(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<UploadResponse>("/cv/upload", formData);
  return data;
}

export async function getCandidate(candidateId: string): Promise<Candidate> {
  const { data } = await api.get<Candidate>(`/cv/${candidateId}`);
  return data;
}

export async function getAnalysis(candidateId: string): Promise<AnalysisResponse> {
  const { data } = await api.get<AnalysisResponse>(`/cv/${candidateId}/analysis`);
  return data;
}

export async function getJobRecommendations(candidateId: string): Promise<JobMatchReport> {
  const { data } = await api.post<JobMatchReport>("/jobs/recommendations", {
    candidate_id: candidateId,
  });
  return data;
}

export async function fetchCvPreviewBlob(candidateId: string): Promise<Blob> {
  // Goes through the shared axios instance (not a raw fetch()) so the x-api-key
  // header attaches automatically and the request stays same-origin-safe — the
  // backend proxies the file from storage instead of handing back a direct S3
  // URL, since S3 has no CORS policy configured for browser fetches.
  const { data } = await api.get<Blob>(`/cv/${candidateId}/preview-file`, { responseType: "blob" });
  return data;
}
