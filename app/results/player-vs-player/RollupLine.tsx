type RollupLineProps = {
  text: string;
};

export function RollupLine({ text }: RollupLineProps) {
  return <p className="px-4 text-sm text-muted-foreground">{text}</p>;
}
