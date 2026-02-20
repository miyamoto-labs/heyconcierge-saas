'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
import { createClient } from '@/lib/supabase/client'

interface Booking {
  id: string
  property_id: string
  guest_name: string
  check_in: string
  check_out: string
  platform: string
  status: string
}

interface Property {
  id: string
  name: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [currentDate, setCurrentDate] = useState(new Date())
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
      loadData(user.id, user.email || '')
    }
    checkAuth()
  }, [])

  const loadData = async (authUserId?: string, authEmail?: string) => {
    setLoading(true)
    try {
      const uid = authUserId

      // Get user's organizations
      let { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('auth_user_id', uid)
        .limit(1)
      
      if (orgs && orgs[0]) {
        // Get properties
        const { data: props } = await supabase
          .from('properties')
          .select('id, name')
          .eq('org_id', orgs[0].id)
        
        setProperties(props || [])

        // Get all bookings
        const propertyIds = props?.map(p => p.id) || []
        if (propertyIds.length > 0) {
          const { data: bkgs } = await supabase
            .from('bookings')
            .select('*')
            .in('property_id', propertyIds)
            .order('check_in', { ascending: true })
          
          setBookings(bkgs || [])
        }
      }
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  const syncCalendar = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync-calendar', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Calendar synced! ${data.message}`)
        await loadData()
      } else {
        const err = await response.json().catch(() => ({}))
        alert(`Sync failed: ${err.error || 'Unknown error'}. Make sure your iCal URLs are configured in property settings.`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      alert('Sync failed. Please try again.')
    }
    setSyncing(false)
  }

  const handleLogout = () => {
    document.cookie = 'user_id=; Max-Age=0; path=/'
    document.cookie = 'user_email=; Max-Age=0; path=/'
    router.push('/login')
  }

  // Generate calendar grid for current month
  const generateCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const getBookingsForDate = (day: number | null) => {
    if (!day) return []
    
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0]
    
    return bookings.filter(booking => {
      if (selectedProperty !== 'all' && booking.property_id !== selectedProperty) {
        return false
      }
      
      return dateStr >= booking.check_in && dateStr <= booking.check_out
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px] sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
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

      <div className="max-w-[1400px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-nunito text-4xl font-black mb-2">📅 Calendar</h1>
            <p className="text-muted">View and sync your bookings</p>
          </div>
          
          <div className="flex gap-4">
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-4 py-2 rounded-full border-2 border-[rgba(108,92,231,0.1)] font-bold text-sm hover:border-primary transition-all outline-none"
            >
              <option value="all">All Properties</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
            
            <button
              onClick={syncCalendar}
              disabled={syncing}
              className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? '🔄 Syncing...' : '🔄 Sync Calendar'}
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-3xl shadow-card p-8">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="w-10 h-10 rounded-full bg-[rgba(108,92,231,0.1)] hover:bg-[rgba(108,92,231,0.2)] font-bold text-xl transition-all"
            >
              ←
            </button>
            <h2 className="font-nunito text-2xl font-black">{monthName}</h2>
            <button
              onClick={nextMonth}
              className="w-10 h-10 rounded-full bg-[rgba(108,92,231,0.1)] hover:bg-[rgba(108,92,231,0.2)] font-bold text-xl transition-all"
            >
              →
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold text-sm text-muted py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {generateCalendar().map((day, idx) => {
              const dayBookings = getBookingsForDate(day)
              const isToday = day && 
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()
              
              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 rounded-xl border-2 transition-all ${
                    day 
                      ? 'bg-white border-[rgba(108,92,231,0.1)] hover:border-primary cursor-pointer' 
                      : 'bg-transparent border-transparent'
                  } ${isToday ? 'border-accent bg-accent-soft' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-bold mb-1 ${isToday ? 'text-accent' : 'text-dark'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map(booking => (
                          <div
                            key={booking.id}
                            className="text-xs px-2 py-1 rounded bg-primary text-white truncate font-bold"
                            title={`${booking.guest_name} (${booking.platform})`}
                          >
                            {booking.guest_name}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-muted font-bold">
                            +{dayBookings.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-3xl font-black">{bookings.length}</div>
            <div className="text-sm text-muted">Total Bookings</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-3xl font-black">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
            <div className="text-sm text-muted">Upcoming</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="text-4xl mb-2">🏠</div>
            <div className="text-3xl font-black">{properties.length}</div>
            <div className="text-sm text-muted">Properties</div>
          </div>
        </div>
      </div>
    </div>
  )
}
