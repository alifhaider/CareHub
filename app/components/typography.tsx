export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl md:text-7xl font-extrabold">{children}</h1>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl md:text-5xl font-semibold">{children}</h2>;
}
