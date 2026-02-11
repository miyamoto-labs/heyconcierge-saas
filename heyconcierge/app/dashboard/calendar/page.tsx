'use client'

import { useState } from 'react'
import Link from 'next/link'
import LogoSVG from '@/components/LogoSVG'

// Mock bookings data for presentation
const MOCK_BOOKINGS = [
  {
    id: 1,
    guest_name: "Sarah Johnson",
    check_in: "2026-02-12",
    check_out: "2026-02-15",
    property: "Tromsø Northern Lights Cabin",
    platform: "airbnb",
    status: "confirmed",
    nights: 3
  },
  {
    id: 2,
    guest_name: "Michael Chen",
    check_in: "2026-02-14",
    check_out: "2026-02-18",
    property: "Bergen Fjord View Apartment",
    platform: "booking",
    status: "confirmed",
    nights: 4
  },
  {
    id: 3,
    guest_name: "Emma Schmidt",
    check_in: "2026-02-16",
    check_out: "2026-02-20",
    property: "Tromsø Northern Lights Cabin",
    platform: "airbnb",
    status: "confirmed",
    nights: 4
  },
  {
    id: 4,
    guest_name: "James Wilson",
    check_in: "2026-02-18",
    check_out: "2026-02-22",
    property: "Oslo City Center Loft",
    platform: "booking",
    status: "confirmed",
    nights: 4
  },
  {
    id: 5,
    guest_name: "Sophie Martin",
    check_in: "2026-02-21",
    check_out: "2026-02-25",
    property: "Bergen Fjord View Apartment",
    platform: "airbnb",
    status: "confirmed",
    nights: 4
  },
]

export default function CalendarPage() {
  const [selectedFilter, setSelectedFilter] = useState('all')

  // Get today's check-ins
  const today = new Date().toISOString().split('T')[0]
  const todayCheckIns = MOCK_BOOKINGS.filter(b => b.check_in === today)

  // Upcoming in next 7 days
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingBookings = MOCK_BOOKINGS.filter(b => {
    const checkIn = new Date(b.check_in)
    return checkIn >= new Date() && checkIn <= nextWeek
  })

  const platformColors = {
    airbnb: 'bg-[#FF5A5F] text-white',
    booking: 'bg-[#003580] text-white'
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="font-nunito text-xl font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-8 h-8" />
            <span className="text-accent">Hey</span><span className="text-dark">Concierge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-bold text-muted hover:text-primary transition-colors no-underline">
              ← Back to Properties
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-nunito text-4xl font-black mb-2">Calendar & Bookings</h1>
          <p className="text-muted">Manage your upcoming reservations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                📅
              </div>
              <div>
                <div className="text-3xl font-black text-dark">{todayCheckIns.length}</div>
                <div className="text-sm text-muted font-semibold">Check-ins Today</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">
                🏠
              </div>
              <div>
                <div className="text-3xl font-black text-dark">{upcomingBookings.length}</div>
                <div className="text-sm text-muted font-semibold">Next 7 Days</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-mint-dark/10 flex items-center justify-center text-2xl">
                💬
              </div>
              <div>
                <div className="text-3xl font-black text-dark">{MOCK_BOOKINGS.length}</div>
                <div className="text-sm text-muted font-semibold">Total Bookings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {['all', 'airbnb', 'booking'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                selectedFilter === filter
                  ? 'bg-primary text-white shadow-[0_4px_15px_rgba(108,92,231,0.3)]'
                  : 'bg-white text-muted border-2 border-[#E8E4FF] hover:border-primary'
              }`}
            >
              {filter === 'all' ? 'All Platforms' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F3FF]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-black text-dark">Guest</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-dark">Property</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-dark">Check-in</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-dark">Check-out</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-dark">Nights</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-dark">Platform</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-dark">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_BOOKINGS
                  .filter(b => selectedFilter === 'all' || b.platform === selectedFilter)
                  .map((booking, idx) => (
                  <tr key={booking.id} className="border-b border-[#E8E4FF] hover:bg-[#F5F3FF] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-dark">{booking.guest_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-dark">{booking.property}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-dark">{booking.check_in}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-dark">{booking.check_out}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted">{booking.nights} nights</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${platformColors[booking.platform]}`}>
                        {booking.platform.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
                        Confirmed
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-sm font-bold text-primary hover:underline">
                        Message Guest
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Check-ins Highlight */}
        {todayCheckIns.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-primary to-accent rounded-2xl p-8 text-white shadow-card-hover">
            <h2 className="font-nunito text-2xl font-black mb-4">🎉 Check-ins Today</h2>
            <div className="space-y-3">
              {todayCheckIns.map(booking => (
                <div key={booking.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">{booking.guest_name}</div>
                      <div className="text-sm opacity-90">{booking.property}</div>
                    </div>
                    <button className="bg-white text-primary px-4 py-2 rounded-full font-bold text-sm hover:bg-white/90 transition-colors">
                      Send Welcome Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
