export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="earth-page"
      style={{ background: '#ffffff', color: '#2C2C2C' }}
    >
      {children}
    </div>
  )
}
