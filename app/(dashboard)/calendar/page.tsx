'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Booking {
  id: string
  property_id: string
  guest_name: string
  check_in_date: string
  check_out_date: string
  platform: string
  status: string
}

interface Property {
  id: string
  name: string
}

// A booking bar segment for one calendar row (week)
interface BookingBar {
  booking: Booking
  startCol: number   // 0-6 column in the week row
  spanCols: number   // how many columns it spans
  isStart: boolean   // does the booking start in this row?
  isEnd: boolean     // does the booking end in this row?
  row: number        // which slot row (0, 1, 2...) for stacking
}

function getBarStyle(_booking: Booking) {
  return { bar: 'bg-emerald-400', text: 'text-white' }
}

function getNights(booking: Booking) {
  return Math.round(
    (new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
  )
}

function getBarLabel(booking: Booking, isStart: boolean) {
  if (!isStart) return ''
  const nights = getNights(booking)
  const nightsLabel = nights === 1 ? '1 night' : `${nights} nights`
  const name = booking.guest_name || 'Guest'
  // iCal "Not available" / "Reserved" entries are still real bookings
  const displayName = name.toLowerCase().includes('not available') || name === 'Blocked'
    ? 'Booked'
    : name
  return `${displayName} · ${nightsLabel}`
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

      let { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('auth_user_id', uid)
        .limit(1)

      if (orgs && orgs[0]) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, name')
          .eq('org_id', orgs[0].id)

        setProperties(props || [])

        const propertyIds = props?.map(p => p.id) || []
        if (propertyIds.length > 0) {
          const { data: bkgs } = await supabase
            .from('bookings')
            .select('*')
            .in('property_id', propertyIds)
            .order('check_in_date', { ascending: true })

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
      const response = await fetch('/api/sync-calendar', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        alert(`Calendar synced! ${data.message}`)
        await loadData()
      } else {
        const err = await response.json().catch(() => ({}))
        alert(`Sync failed: ${err.error || 'Unknown error'}`)
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

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  // Build calendar weeks: array of weeks, each week is array of 7 day numbers (null for padding)
  const weeks = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDow = firstDay.getDay() // 0=Sun

    const allDays: (number | null)[] = []
    for (let i = 0; i < startDow; i++) allDays.push(null)
    for (let d = 1; d <= daysInMonth; d++) allDays.push(d)
    while (allDays.length % 7 !== 0) allDays.push(null)

    const result: (number | null)[][] = []
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7))
    }
    return result
  }, [currentDate])

  // Filter bookings by selected property
  const filteredBookings = useMemo(() => {
    return bookings.filter(b =>
      selectedProperty === 'all' || b.property_id === selectedProperty
    )
  }, [bookings, selectedProperty])

  // For each week row, compute which booking bars appear
  const weekBars = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    return weeks.map((week) => {
      // Get date range for this week row
      const weekDates: (string | null)[] = week.map(day => {
        if (day === null) return null
        return new Date(year, month, day).toISOString().split('T')[0]
      })

      // Find first and last valid date in this week
      const validDates = weekDates.filter(Boolean) as string[]
      if (validDates.length === 0) return []

      const weekStart = validDates[0]
      const weekEnd = validDates[validDates.length - 1]

      // Find bookings that overlap this week
      // Booking overlaps if: check_in < day_after_weekEnd AND check_out > weekStart
      const dayAfterWeekEnd = new Date(weekEnd)
      dayAfterWeekEnd.setDate(dayAfterWeekEnd.getDate() + 1)
      const dayAfterStr = dayAfterWeekEnd.toISOString().split('T')[0]

      const overlapping = filteredBookings.filter(b => {
        return b.check_in_date < dayAfterStr && b.check_out_date > weekStart
      })

      // For each overlapping booking, compute its bar segment in this week
      const bars: BookingBar[] = []
      const slotMap: Record<string, number> = {} // booking.id → assigned row

      for (const booking of overlapping) {
        // Find startCol: which column does this booking start in this week?
        let startCol = 0
        for (let c = 0; c < 7; c++) {
          const d = weekDates[c]
          if (d && d >= booking.check_in_date && d < booking.check_out_date) {
            startCol = c
            break
          }
        }

        // Find endCol: last column this booking occupies in this week
        let endCol = startCol
        for (let c = startCol; c < 7; c++) {
          const d = weekDates[c]
          if (d && d >= booking.check_in_date && d < booking.check_out_date) {
            endCol = c
          } else if (d && d >= booking.check_out_date) {
            break
          }
        }

        const spanCols = endCol - startCol + 1
        const isStart = weekDates.some(d => d === booking.check_in_date)
        const isEnd = (() => {
          // Check-out date is the day after the last night
          const lastNight = new Date(booking.check_out_date)
          lastNight.setDate(lastNight.getDate() - 1)
          const lastNightStr = lastNight.toISOString().split('T')[0]
          return weekDates.some(d => d === lastNightStr)
        })()

        // Assign a slot row (stack bookings that overlap on same days)
        let row = 0
        while (bars.some(b => b.row === row && !(b.startCol + b.spanCols <= startCol || startCol + spanCols <= b.startCol))) {
          row++
        }
        slotMap[booking.id] = row

        bars.push({ booking, startCol, spanCols, isStart, isEnd, row })
      }

      return bars
    })
  }, [weeks, filteredBookings, currentDate])

  // Max bar rows across all weeks (for consistent row height)
  const maxBarRows = useMemo(() => {
    return Math.max(1, ...weekBars.map(bars => {
      if (bars.length === 0) return 0
      return Math.max(...bars.map(b => b.row)) + 1
    }))
  }, [weekBars])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-grove border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const barHeight = 24
  const barGap = 2
  const dayNumberHeight = 28
  const minCellHeight = dayNumberHeight + maxBarRows * (barHeight + barGap) + 8

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-8 py-4 border-b border-earth-border bg-white/90 backdrop-blur-[12px] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-earth-dark tracking-tight no-underline flex items-center gap-2">
            <div className="w-8 h-8 bg-grove rounded-lg flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" /><path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" /><rect x="5" y="17" width="22" height="4" rx="1.5" /></svg></div>
            <span className="font-serif text-earth-dark hidden sm:inline">HeyConcierge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-earth-muted hover:text-earth-dark font-bold">← Dashboard</Link>
            <Link href="/upselling" className="text-sm text-earth-dark hover:text-grove font-bold">Upselling</Link>
            <span className="text-sm text-earth-muted">{userEmail}</span>
            <button onClick={handleLogout} className="text-sm text-earth-muted hover:text-earth-dark font-bold">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-earth-dark tracking-tight mb-2">Calendar</h1>
            <p className="text-earth-muted">View and sync your bookings</p>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-4 py-2 rounded-full border-2 border-earth-border font-bold text-sm hover:border-grove transition-all outline-none"
            >
              <option value="all">All Properties</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
            <button
              onClick={syncCalendar}
              disabled={syncing}
              className="bg-grove text-white px-6 py-2 rounded-full font-bold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? 'Syncing...' : 'Sync Calendar'}
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl border border-earth-border p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={previousMonth} className="w-10 h-10 rounded-full bg-grove/[0.08] hover:bg-grove/[0.14] font-bold text-xl transition-all">←</button>
            <h2 className="text-2xl font-extrabold text-earth-dark tracking-tight">{monthName}</h2>
            <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-grove/[0.08] hover:bg-grove/[0.14] font-bold text-xl transition-all">→</button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-earth-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold text-xs text-earth-light uppercase tracking-wider py-3">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Rows */}
          {weeks.map((week, weekIdx) => {
            const bars = weekBars[weekIdx]
            const today = new Date()

            return (
              <div key={weekIdx} className="relative grid grid-cols-7 border-b border-earth-border last:border-b-0">
                {week.map((day, colIdx) => {
                  const isToday = day &&
                    day === today.getDate() &&
                    currentDate.getMonth() === today.getMonth() &&
                    currentDate.getFullYear() === today.getFullYear()

                  return (
                    <div
                      key={colIdx}
                      className={`relative border-r border-earth-border last:border-r-0 ${!day ? 'bg-slate-50/50' : ''}`}
                      style={{ minHeight: `${minCellHeight}px` }}
                    >
                      {day && (
                        <div className={`text-sm font-semibold p-2 pb-0 ${
                          isToday
                            ? 'text-white'
                            : 'text-earth-text'
                        }`}>
                          {isToday ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-grove text-white text-sm font-bold">
                              {day}
                            </span>
                          ) : day}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Booking bars overlaid on this week row */}
                {bars.map((bar, barIdx) => {
                  const style = getBarStyle(bar.booking)
                  const label = getBarLabel(bar.booking, bar.isStart)
                  const nights = Math.round(
                    (new Date(bar.booking.check_out_date).getTime() - new Date(bar.booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
                  )

                  // Position: percentage-based within the 7-col grid
                  const leftPct = (bar.startCol / 7) * 100
                  const widthPct = (bar.spanCols / 7) * 100

                  return (
                    <div
                      key={bar.booking.id + '-' + barIdx}
                      className={`absolute ${style.bar} ${style.text} flex items-center overflow-hidden cursor-default
                        ${bar.isStart ? 'rounded-l-full pl-3' : 'pl-2'}
                        ${bar.isEnd ? 'rounded-r-full pr-3' : 'pr-1'}
                      `}
                      style={{
                        left: `calc(${leftPct}% + 4px)`,
                        width: `calc(${widthPct}% - 8px)`,
                        top: `${dayNumberHeight + bar.row * (barHeight + barGap)}px`,
                        height: `${barHeight}px`,
                      }}
                      title={`${bar.booking.guest_name} (${bar.booking.platform})\n${bar.booking.check_in_date} → ${bar.booking.check_out_date} (${nights} nights)`}
                    >
                      <span className="text-xs font-bold truncate whitespace-nowrap">
                        {bar.isStart ? label : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-earth-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-2.5 rounded-full bg-emerald-400"></div>
              <span className="text-xs text-earth-muted font-semibold">Booked</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {(() => {
          const year = currentDate.getFullYear()
          const month = currentDate.getMonth()
          const daysInMonth = new Date(year, month + 1, 0).getDate()

          // Count booked nights this month
          let bookedNights = 0
          for (const b of filteredBookings) {
            const ci = new Date(Math.max(new Date(b.check_in_date).getTime(), new Date(year, month, 1).getTime()))
            const co = new Date(Math.min(new Date(b.check_out_date).getTime(), new Date(year, month + 1, 0).getTime() + 86400000))
            const nights = Math.max(0, Math.round((co.getTime() - ci.getTime()) / 86400000))
            bookedNights += nights
          }
          const occupancyPct = daysInMonth > 0 ? Math.round((bookedNights / daysInMonth) * 100) : 0

          return (
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="bg-white rounded-xl border border-earth-border p-6">
                <div className="text-3xl font-black">{filteredBookings.length}</div>
                <div className="text-sm text-earth-muted">Upcoming Guests</div>
              </div>
              <div className="bg-white rounded-xl border border-earth-border p-6">
                <div className="text-3xl font-black">{bookedNights}</div>
                <div className="text-sm text-earth-muted">Booked Nights</div>
              </div>
              <div className="bg-white rounded-xl border border-earth-border p-6">
                <div className="text-3xl font-black">{occupancyPct}%</div>
                <div className="text-sm text-earth-muted">Occupancy Rate</div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
