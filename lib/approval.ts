const DECISIONS = new Set(["approved", "rejected", "suspended", "pending"]);

/** Shared by the admin action and the database function: a rejection needs a reason. */
export function reviewInputError(status: string, notes: string): string | null {
  if (!DECISIONS.has(status)) return "Invalid request.";
  if ((status === "rejected" || status === "suspended") && notes.trim().length < 2) {
    return "Write a short reason before rejecting.";
  }
  return null;
}

export type ApprovalQueue = "passenger" | "rider" | "partner";

/** Sentence that follows the admin's name in the notification row. */
export function approvalNoticeBody(queue: ApprovalQueue, status: string, notes: string): string {
  const reason = notes.trim();
  if (queue === "passenger" && status === "approved") return "approved your booking access. You can book rides now.";
  if (queue === "passenger" && status === "rejected") return `did not approve booking yet. ${reason}`;
  if (queue === "rider" && status === "approved") return "approved your captain application. You can go online.";
  if (queue === "rider" && status === "rejected") return `did not approve your captain application. ${reason}`;
  if (status === "suspended") return `suspended your SheRides access. ${reason}`;
  if (queue === "partner" && status === "approved") {
    return "approved your partner application. SheRides will contact you about next steps.";
  }
  if (queue === "partner" && status === "rejected") return `did not approve your partner application. ${reason}`;
  return "moved your SheRides application back to review.";
}
