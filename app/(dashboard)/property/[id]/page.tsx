'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PropertyViewPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [property, setProperty] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email || null)
      loadProperty()
    }
    checkAuth()
  }, [])

  const loadProperty = async () => {
    setLoading(true)
    try {
      const { data: prop } = await supabase
        .from('properties')
        .select('*, property_config_sheets(*)')
        .eq('id', propertyId)
        .single()

      if (prop) {
        setProperty(prop)

        // Generate QR code
        try {
          const QRCode = (await import('qrcode')).default
          const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'HeyConciergeBot'
          const qrUrl = `https://t.me/${botUsername}?start=${propertyId}`
          const dataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2, color: { dark: '#2D2B55', light: '#FFFFFF' } })
          setQrDataUrl(dataUrl)
        } catch (err) {
          console.error('QR code generation error:', err)
        }

        // Load messages
        const { data: msgs } = await supabase
          .from('goconcierge_messages')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(10)
        
        setMessages(msgs || [])

        // Load bookings
        const { data: bkgs } = await supabase
          .from('bookings')
          .select('*')
          .eq('property_id', propertyId)
          .order('check_in_date', { ascending: false })
          .limit(10)
        
        setBookings(bkgs || [])
      }
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  const handleLogout = () => {
    document.cookie = 'user_id=; Max-Age=0; path=/'
    document.cookie = 'user_email=; Max-Age=0; path=/'
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-grove border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-earth-dark mb-4">Property not found</h1>
          <Link href="/dashboard" className="text-grove font-medium no-underline">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-8 py-4 border-b border-earth-border bg-white/90 backdrop-blur-[12px] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight no-underline flex items-center gap-2.5">
            <div className="w-8 h-8 bg-grove rounded-lg flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" /><path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" /><rect x="5" y="17" width="22" height="4" rx="1.5" /></svg></div>
            <span className="font-serif text-earth-dark hidden sm:inline">HeyConcierge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-earth-muted hover:text-earth-dark font-medium no-underline">← Dashboard</Link>
            <Link href="/upselling" className="text-sm text-earth-text hover:text-grove font-medium no-underline">Upselling</Link>
            <span className="text-sm text-earth-light hidden sm:inline">{userEmail}</span>
            <button onClick={handleLogout} className="text-sm text-earth-muted hover:text-earth-dark font-medium">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Property Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-earth-dark mb-1.5">{property.name}</h1>
              <p className="text-earth-muted">{property.address}</p>
            </div>
            <Link
              href={`/property/${propertyId}/settings`}
              className="bg-grove hover:bg-grove-dark text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all no-underline"
            >
              Settings
            </Link>
          </div>

          {property.images?.[0] && (
            <img
              src={property.images[0]}
              alt={property.name}
              className="w-full h-64 object-cover rounded-xl"
            />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl border border-earth-border p-6">
            <div className="w-10 h-10 bg-grove-subtle rounded-lg flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-grove"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="text-3xl font-bold text-earth-dark mb-0.5">{messages.length}</div>
            <div className="text-sm text-earth-muted">Messages</div>
          </div>

          <div className="bg-white rounded-xl border border-earth-border p-6">
            <div className="w-10 h-10 bg-grove-subtle rounded-lg flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-grove"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round"/></svg>
            </div>
            <div className="text-3xl font-bold text-earth-dark mb-0.5">{bookings.length}</div>
            <div className="text-sm text-earth-muted">Bookings</div>
          </div>

          <div className="bg-white rounded-xl border border-earth-border p-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${property.whatsapp_number ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={property.whatsapp_number ? 'text-emerald-600' : 'text-amber-500'}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.07 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="text-xl font-semibold text-earth-dark mb-0.5">{property.whatsapp_number ? 'Active' : 'Setup Required'}</div>
            <div className="text-sm text-earth-muted">Messaging Status</div>
          </div>
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="bg-white rounded-xl border border-earth-border p-6 sm:p-8 mb-8">
            <h2 className="font-serif text-2xl text-earth-dark mb-6">Guest QR Code</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-grove-subtle rounded-xl p-6">
                <img src={qrDataUrl} alt="QR Code" className="w-[200px] h-[200px]" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-earth-muted mb-4">
                  Print this QR code and place it in your property. Guests scan it to open Telegram and start chatting with your AI concierge instantly.
                </p>
                <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                  <a
                    href={qrDataUrl}
                    download={`heyconcierge-qr-${property.name}.png`}
                    className="inline-flex items-center gap-2 bg-grove hover:bg-grove-dark text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all no-underline"
                  >
                    Download QR
                  </a>
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank')
                      if (printWindow) {
                        printWindow.document.write(`
                          <html><head><title>QR Code - ${property.name}</title></head>
                          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
                            <img src="${qrDataUrl}" style="width:300px;height:300px;" />
                            <h2 style="margin-top:16px;">${property.name}</h2>
                            <p style="color:#666;">Scan to chat with HeyConcierge</p>
                          </body></html>
                        `)
                        printWindow.document.close()
                        printWindow.print()
                      }
                    }}
                    className="inline-flex items-center gap-2 border border-earth-border text-earth-text px-5 py-2.5 rounded-lg font-semibold text-sm hover:border-grove hover:text-grove transition-all"
                  >
                    Print QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Messages */}
        <div className="bg-white rounded-xl border border-earth-border p-6 sm:p-8 mb-8">
          <h2 className="font-serif text-2xl text-earth-dark mb-6">Recent Messages</h2>

          {messages.length === 0 ? (
            <div className="text-center py-12 text-earth-muted">
              <div className="w-12 h-12 bg-grove-subtle rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-grove"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p>No messages yet. Share the QR code and start chatting!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="border-l-2 border-grove pl-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-earth-muted">{msg.guest_phone}</span>
                    <span className="text-xs text-earth-light">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="mb-2">
                    <strong className="text-sm text-earth-text">Guest:</strong> <span className="text-sm text-earth-text">{msg.message}</span>
                  </div>
                  <div>
                    <strong className="text-sm text-grove">AI:</strong> <span className="text-sm text-earth-muted">{msg.response}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl border border-earth-border p-6 sm:p-8">
          <h2 className="font-serif text-2xl text-earth-dark mb-6">Upcoming Bookings</h2>

          {bookings.length === 0 ? (
            <div className="text-center py-12 text-earth-muted">
              <div className="w-12 h-12 bg-grove-subtle rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-grove"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round"/></svg>
              </div>
              <p>No bookings yet. Connect your iCal URL in settings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-grove-subtle rounded-xl">
                  <div>
                    <div className="font-semibold text-earth-dark">{booking.guest_name}</div>
                    <div className="text-sm text-earth-muted">
                      {new Date(booking.check_in_date).toLocaleDateString()} – {new Date(booking.check_out_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-grove text-white px-3 py-1 rounded-full font-semibold">
                      {booking.platform}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
