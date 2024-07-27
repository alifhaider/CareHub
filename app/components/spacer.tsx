export function Spacer({ variant }: { variant: "sm" | "md" | "lg" }) {
  if (!variant) {
    return null;
  }

  if (variant === "sm") {
    return <div className="h-4" />;
  }
  if (variant === "md") {
    return <div className="h-8" />;
  }

  return <div className="h-16" />;
}
