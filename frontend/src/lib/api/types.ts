export interface Experience {
  company: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  summary: string;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field_of_study: string | null;
  graduation_year: string | null;
}

export interface ExtractedCV {
  full_name: string;
  email: string | null;
  phone: string | null;
  headline: string | null;
  skills: string[];
  years_of_experience: number;
  experience: Experience[];
  education: Education[];
  certifications: string[];
}

export interface Improvement {
  section: string;
  issue: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export interface ImprovementReport {
  overall_score: number;
  strengths: string[];
  improvements: Improvement[];
}

export interface SkillGap {
  skill: string;
  resource_name: string;
  resource_url: string;
}

export interface JobMatch {
  job_title: string;
  match_score: number;
  reasoning: string;
  apply_links: string[];
  skill_gaps: SkillGap[];
}

export interface JobMatchReport {
  matches: JobMatch[];
}

export type CandidateStatus = "processing" | "analyzed" | "failed";

export interface Candidate {
  _id: string;
  full_name: string | null;
  email: string | null;
  cv_s3_key: string;
  original_filename: string;
  uploaded_at: string;
  status: CandidateStatus;
  error_detail: string | null;
}

export interface UploadResponse {
  candidate_id: string;
  status: CandidateStatus;
}

// GET /cv/{id}/analysis — extracted_profile/improvements are only present once
// status is "analyzed" (see backend/app/routers/analysis.py).
export interface AnalysisResponse {
  candidate_id: string;
  status: CandidateStatus;
  extracted_profile?: ExtractedCV;
  improvements?: ImprovementReport;
  job_matches?: JobMatchReport;
}
