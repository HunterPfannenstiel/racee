import { PageShell } from "@/components/ui/page-shell";

interface ComingSoonProps {
  title: string;
  message?: string;
  preview?: string;
}

export function ComingSoon({ title, message = "This page is coming soon.", preview }: ComingSoonProps) {
  return (
    <PageShell title={title}>
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <span className="text-4xl">🏁</span>
        <p className="text-muted-foreground text-sm">{message}</p>
        {preview && (
          <p className="text-xs text-muted-foreground/70 max-w-xs leading-relaxed">{preview}</p>
        )}
      </div>
    </PageShell>
  );
}
