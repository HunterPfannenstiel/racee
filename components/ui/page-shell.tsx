interface PageShellProps {
  title: string;
  children: React.ReactNode;
}

export function PageShell({ title, children }: PageShellProps) {
  return (
    <main className="w-full px-4 py-10 space-y-8">
      <div className="border-l-4 border-primary pl-4">
        <h1 className="font-heading text-[1.75rem] font-bold text-foreground">{title}</h1>
      </div>
      {children}
    </main>
  );
}
