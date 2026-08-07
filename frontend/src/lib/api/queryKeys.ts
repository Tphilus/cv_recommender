export const candidateKeys = {
  all: ["candidates"] as const,
  list: () => [...candidateKeys.all, "list"] as const,
  detail: (candidateId: string) => [...candidateKeys.all, candidateId] as const,
  analysis: (candidateId: string) => [...candidateKeys.detail(candidateId), "analysis"] as const,
  preview: (candidateId: string) => [...candidateKeys.detail(candidateId), "preview"] as const,
};
