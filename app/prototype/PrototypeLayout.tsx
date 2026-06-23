/**
 * Usage:
 *
 * <PrototypeLayout
 *   feature="User Profile"
 *   // The feature's main export — the fully composed component ready for integration.
 *   assembled={<ProfileCard user={mockUser} />}
 * >
 *   <PrototypeSection name="Avatar">
 *     <Avatar src="/mock-avatar.png" />
 *   </PrototypeSection>
 *
 *   <PrototypeSection name="Bio Editor">
 *     <BioEditor value="Hello world" onChange={() => {}} />
 *   </PrototypeSection>
 * </PrototypeLayout>
 */

import { Separator } from "@/components/ui/separator";

export function PrototypeSection({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {name}
        </h2>
        <Separator />
      </div>
      {children}
    </section>
  );
}

export function PrototypeLayout({
  feature,
  assembled,
  children,
}: {
  feature: string;
  assembled: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="h-screen flex flex-col">
        <header className="p-8 pb-4 shrink-0 flex flex-col gap-1">
          <h1 className="font-mono text-sm uppercase tracking-widest">
            {feature}
          </h1>
        </header>
        <div className="flex-1 min-h-0">{assembled}</div>
      </div>
      <div className="p-8 flex flex-col gap-12">{children}</div>
    </>
  );
}
