interface PageShellProps {
  title: string;
  children: React.ReactNode;
}

export function PageShell({ title, children }: PageShellProps) {
  return (
    <main className="w-full max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="border-l-4 border-primary pl-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      </div>
      {children}
    </main>
  );
}
