export function Spacer({ variant }: { variant: 'sm' | 'md' | 'lg' }) {
  if (!variant) {
    return null
  }

  if (variant === 'sm') {
    return <div className="h-4 md:h-6 lg:h-8" />
  }
  if (variant === 'md') {
    return <div className="h-6 md:h-8 lg:h-10" />
  }

  return <div className="h-10 md:h-12 lg:h-16" />
}
