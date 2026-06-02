import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { UserContextProvider } from "@/app/context/UserContext";
import { LeagueContextProvider } from "@/app/context/LeagueContext";
import { AppShell } from "@/app/components/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Racee",
  description: "F1 race prediction and prop bets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-background">
        <TooltipProvider>
          <UserContextProvider>
            <LeagueContextProvider>
              <AppShell>{children}</AppShell>
            </LeagueContextProvider>
          </UserContextProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
