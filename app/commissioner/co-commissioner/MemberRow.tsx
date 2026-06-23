"use client";

type MemberRowProps = {
  name: string;
  onClick?: () => void;
};

export function MemberRow({ name, onClick }: MemberRowProps) {
  return (
    <button
      type="button"
      className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-muted/50 text-foreground"
      onClick={onClick}
    >
      {name}
    </button>
  );
}
