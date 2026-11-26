/** Today's calendar day (YYYY-MM-DD) in US Central time, the day season-pick lock dates count in. */
export function centralToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
