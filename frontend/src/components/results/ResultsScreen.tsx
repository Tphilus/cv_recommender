import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { fetchCvPreviewBlob } from "../../api/client";
import type { ExtractedCV, ImprovementReport } from "../../types/api";
import FilePreviewDialog from "../upload/FilePreviewDialog";
import ExtractedProfileTab from "./ExtractedProfileTab";
import ImprovementReportTab from "./ImprovementReportTab";
import JobMatchesTab from "./JobMatchesTab";

interface ResultsScreenProps {
  candidateId: string;
  filename: string;
  profile: ExtractedCV;
  improvements: ImprovementReport;
  onStartOver: () => void;
}

export default function ResultsScreen({
  candidateId,
  filename,
  profile,
  improvements,
  onStartOver,
}: ResultsScreenProps) {
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  async function handlePreview() {
    setPreviewLoading(true);
    try {
      const blob = await fetchCvPreviewBlob(candidateId);
      setPreviewFile(new File([blob], filename, { type: blob.type }));
      setPreviewOpen(true);
    } catch (err) {
      console.error("Failed to fetch CV preview:", err);
      toast.error("Couldn't open the preview. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
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
            disabled={previewLoading}
            title={filename}
          >
            {previewLoading ? "Loading…" : "Preview CV"}
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
        <JobMatchesTab candidateId={candidateId} />
      </TabsContent>

      <FilePreviewDialog
        file={previewFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </Tabs>
  );
}
