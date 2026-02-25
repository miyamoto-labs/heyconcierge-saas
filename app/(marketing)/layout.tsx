import dynamic from 'next/dynamic'

const ChatWidget = dynamic(() => import('@/components/chat/SimpleChatWidget'), {
  ssr: false,
})

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  )
}
