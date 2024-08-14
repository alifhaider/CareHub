export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl font-extrabold md:text-7xl">{children}</h1>
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl font-extrabold md:text-5xl">{children}</h2>
}
