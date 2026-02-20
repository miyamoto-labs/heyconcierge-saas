'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
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
        
        // Load messages
        const { data: msgs } = await supabase
          .from('goconcierge_messages')
          .select('*')
          .eq('property_id', propertyId)
          .order('timestamp', { ascending: false })
          .limit(10)
        
        setMessages(msgs || [])

        // Load bookings
        const { data: bkgs } = await supabase
          .from('bookings')
          .select('*')
          .eq('property_id', propertyId)
          .order('check_in', { ascending: false })
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black mb-4">Property not found</h1>
          <Link href="/dashboard" className="text-primary font-bold">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-nunito text-xl font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-8 h-8" />
            <span className="text-accent">Hey</span><span className="text-dark">Concierge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted hover:text-dark font-bold">← Dashboard</Link>
            <Link href="/upselling" className="text-sm text-dark hover:text-primary font-bold">💰 Upselling</Link>
            <span className="text-sm text-muted">{userEmail}</span>
            <button onClick={handleLogout} className="text-sm text-muted hover:text-dark font-bold">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-8 py-12">
        {/* Property Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-nunito text-4xl font-black mb-2">{property.name}</h1>
              <p className="text-muted">{property.address}</p>
            </div>
            <Link
              href={`/property/${propertyId}/settings`}
              className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:-translate-y-0.5 transition-all no-underline"
            >
              ⚙️ Settings
            </Link>
          </div>

          {property.images?.[0] && (
            <img
              src={property.images[0]}
              alt={property.name}
              className="w-full h-64 object-cover rounded-2xl"
            />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="text-4xl mb-2">💬</div>
            <div className="text-3xl font-black">{messages.length}</div>
            <div className="text-sm text-muted">Messages</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-3xl font-black">{bookings.length}</div>
            <div className="text-sm text-muted">Bookings</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="text-4xl mb-2">{property.whatsapp_number ? '✅' : '⚠️'}</div>
            <div className="text-xl font-black">{property.whatsapp_number ? 'Active' : 'Setup Required'}</div>
            <div className="text-sm text-muted">Messaging Status</div>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-2xl shadow-card p-8 mb-8">
          <h2 className="font-nunito text-2xl font-black mb-6">Recent Messages</h2>
          
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <div className="text-6xl mb-4">💬</div>
              <p>No messages yet. Share the QR code and start chatting!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-muted">{msg.guest_phone}</span>
                    <span className="text-xs text-muted">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="mb-2">
                    <strong className="text-sm">Guest:</strong> {msg.message}
                  </div>
                  <div>
                    <strong className="text-sm text-primary">AI:</strong> {msg.response}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <h2 className="font-nunito text-2xl font-black mb-6">Upcoming Bookings</h2>
          
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <div className="text-6xl mb-4">📅</div>
              <p>No bookings yet. Connect your iCal URL in settings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-[rgba(108,92,231,0.05)] rounded-xl">
                  <div>
                    <div className="font-bold">{booking.guest_name}</div>
                    <div className="text-sm text-muted">
                      {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-bold">
                      {booking.platform}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      booking.status === 'confirmed' ? 'bg-mint-soft text-mint-dark' : 'bg-yellow-soft text-yellow-dark'
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
