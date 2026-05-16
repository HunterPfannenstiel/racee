type Props = {
  name: string;
  image?: string;
  className?: string;
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

export function RacerAvatar({ name, image, className = "w-8 h-8" }: Props) {
  if (image) {
    return <img src={image} alt={name} className={`${className} rounded-full object-cover`} />;
  }
  return (
    <div className={`${className} rounded-full bg-muted flex items-center justify-center text-xs font-medium`}>
      {getInitials(name)}
    </div>
  );
}
