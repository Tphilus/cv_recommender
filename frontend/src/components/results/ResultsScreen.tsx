import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { useAnalysisQuery } from "@/lib/hooks/useAnalysisQuery";
import { useCvPreviewMutation } from "@/lib/hooks/cvMutations";
import FilePreviewDialog from "../upload/FilePreviewDialog";
import ExtractedProfileTab from "./ExtractedProfileTab";
import ImprovementReportTab from "./ImprovementReportTab";
import JobMatchesTab from "./JobMatchesTab";

interface ResultsScreenProps {
  candidateId: string;
  filename: string;
  onStartOver: () => void;
}

export default function ResultsScreen({ candidateId, filename, onStartOver }: ResultsScreenProps) {
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewMutation = useCvPreviewMutation();

  // Already populated by useCvAnalysisSession up in App — this reads straight
  // from the React Query cache, no extra network request.
  const { data: analysis } = useAnalysisQuery(candidateId, true);
  if (!analysis?.extracted_profile || !analysis.improvements || !analysis.job_matches) return null;
  const { extracted_profile: profile, improvements, job_matches: jobs } = analysis;

  function handlePreview() {
    previewMutation.mutate(candidateId, {
      onSuccess: (blob) => {
        setPreviewFile(new File([blob], filename, { type: blob.type }));
        setPreviewOpen(true);
      },
      onError: (err) => {
        console.error("Failed to fetch CV preview:", err);
        toast.error("Couldn't open the preview. Please try again.");
      },
    });
  }

  return (
    <Tabs defaultValue="profile">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="profile">Extracted Profile</TabsTrigger>
          <TabsTrigger value="improvements">Improvement Report</TabsTrigger>
          <TabsTrigger value="jobs">Job Matches</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            title={filename}
          >
            {previewMutation.isPending ? "Loading…" : "Preview CV"}
          </Button>
          <Button variant="link" className="text-primary" onClick={onStartOver}>
            Upload another CV
          </Button>
        </div>
      </div>

      <TabsContent value="profile">
        <ExtractedProfileTab profile={profile} />
      </TabsContent>
      <TabsContent value="improvements">
        <ImprovementReportTab report={improvements} />
      </TabsContent>
      <TabsContent value="jobs">
        <JobMatchesTab report={jobs} />
      </TabsContent>

      <FilePreviewDialog
        file={previewFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </Tabs>
  );
}
