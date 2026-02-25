import dynamic from 'next/dynamic'

const TestWidget = dynamic(() => import('@/components/chat/TestWidget'), {
  ssr: false,
})

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TestWidget />
    </>
  )
}
