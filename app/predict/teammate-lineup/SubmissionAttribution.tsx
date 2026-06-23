"use client";

type SubmissionAttributionProps = {
  submittedByName: string;
  teamColor?: string;
};

export function SubmissionAttribution({
  submittedByName,
  teamColor,
}: SubmissionAttributionProps) {
  return (
    <span
      className="text-[10px] text-muted-foreground"
      style={
        teamColor
          ? {
              textDecoration: "underline",
              textDecorationColor: teamColor,
              textUnderlineOffset: "3px",
              textDecorationThickness: "2px",
            }
          : undefined
      }
    >
      Set by: {submittedByName}
    </span>
  );
}
