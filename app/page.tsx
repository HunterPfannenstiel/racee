import { Flag, Trophy, BarChart2 } from "lucide-react";
import { SignInCTA } from "@/app/components/SignInCTA";

const FEATURES = [
  {
    Icon: Flag,
    headline: "Predict race outcomes",
    detail: "Submit your picks before the lights go out",
  },
  {
    Icon: Trophy,
    headline: "Compete in a league",
    detail: "Race your crew every Grand Prix weekend",
  },
  {
    Icon: BarChart2,
    headline: "Track season standings",
    detail: "Race by race, point by point",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col min-h-full px-6 py-12 max-w-[430px] mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-10">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground mb-3">
            F1 Prediction League
          </p>
          <h1 className="font-heading text-[80px] font-extrabold leading-none tracking-[-0.02em] text-foreground uppercase">
            Racee
          </h1>
        </div>

        <div className="border-t border-border" />

        <ul className="space-y-7">
          {FEATURES.map(({ Icon, headline, detail }) => (
            <li key={headline} className="flex gap-4 items-start">
              <div className="mt-0.5 shrink-0 size-9 rounded-sm bg-surface flex items-center justify-center border border-border">
                <Icon className="size-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-foreground uppercase leading-tight">
                  {headline}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <SignInCTA />
    </main>
  );
}
