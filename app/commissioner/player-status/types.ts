export type SubmissionStatus = "submitted" | "pending" | "missed";

export type MemberSubmission = {
  id: string;
  name: string;
  status: SubmissionStatus;
  submittedAt: string | null;
};
