import Link from "next/link";

const NAV_TILES = [
  { href: "/predict",  label: "Predict",   sub: "Submit your order" },
  { href: "/view",     label: "Standings", sub: "Season leaderboard" },
];

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-16">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          F1 Prediction League
        </p>
        <h1 className="text-7xl font-bold tracking-tighter text-foreground leading-none">
          Racee
        </h1>
      </div>

      <nav className="flex gap-8">
        {NAV_TILES.map(({ href, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-1 border-l-2 border-border pl-5 py-1 transition-colors hover:border-primary"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-primary">
              {sub}
            </span>
            <span className="text-2xl font-bold text-foreground">{label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
