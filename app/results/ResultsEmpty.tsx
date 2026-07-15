import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

export function ResultsEmpty() {
  return (
    <div className="mx-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No results yet</EmptyTitle>
          <EmptyDescription>No results yet for this race.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
