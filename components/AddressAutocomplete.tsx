'use client'

import { useEffect, useRef, useState } from 'react'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Load Google Maps script once
let googleMapsLoaded = false
let googleMapsLoading = false
const loadCallbacks: (() => void)[] = []

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (googleMapsLoaded) { resolve(); return }
    loadCallbacks.push(resolve)
    if (googleMapsLoading) return
    googleMapsLoading = true

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      googleMapsLoaded = true
      loadCallbacks.forEach(cb => cb())
      loadCallbacks.length = 0
    }
    document.head.appendChild(script)
  })
}

interface AddressResult {
  address: string
  postalCode: string
  city: string
  country: string // 2-letter code
  lat: number | null
  lng: number | null
}

interface Props {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (result: AddressResult) => void
  placeholder?: string
}

export default function AddressAutocomplete({ value, onChange, onAddressSelect, placeholder = '123 Sunset Blvd' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return
    loadGoogleMaps().then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.address_components) return

      let street = ''
      let streetNumber = ''
      let postalCode = ''
      let city = ''
      let country = ''
      let lat: number | null = null
      let lng: number | null = null

      for (const comp of place.address_components) {
        const type = comp.types[0]
        if (type === 'street_number') streetNumber = comp.long_name
        if (type === 'route') street = comp.long_name
        if (type === 'postal_code') postalCode = comp.long_name
        if (type === 'locality' || type === 'postal_town') city = comp.long_name
        if (type === 'country') country = comp.short_name
      }

      if (place.geometry?.location) {
        lat = place.geometry.location.lat()
        lng = place.geometry.location.lng()
      }

      const fullAddress = streetNumber ? `${street} ${streetNumber}` : street

      onAddressSelect({
        address: fullAddress,
        postalCode,
        city,
        country,
        lat,
        lng,
      })
    })

    autocompleteRef.current = autocomplete
  }, [ready])

  return (
    <div>
      <label className="block text-sm font-bold text-dark mb-1.5">Street Address</label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4FF] bg-white text-dark font-medium placeholder:text-[#C4BFFF] focus:border-primary focus:outline-none transition-colors"
        autoComplete="off"
      />
    </div>
  )
}
