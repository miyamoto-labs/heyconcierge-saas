'use client'

import { useState } from 'react'

export default function UltraSimpleWidget() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          backgroundColor: '#8B5CF6',
          color: 'white',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          fontSize: '32px',
          zIndex: 999999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        💬
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '350px',
      height: '500px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#8B5CF6',
        color: 'white',
        padding: '16px',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontWeight: 'bold' }}>HeyConcierge</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Online</div>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        backgroundColor: '#F9FAFB'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '12px',
          marginBottom: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          Hi! 👋 Send us a message and we'll get back to you shortly.
        </div>
        <div style={{
          backgroundColor: '#8B5CF6',
          color: 'white',
          padding: '12px',
          borderRadius: '12px',
          marginLeft: 'auto',
          maxWidth: '80%',
          marginBottom: '8px'
        }}>
          This is a test message
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #E5E7EB'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
          <button style={{
            backgroundColor: '#8B5CF6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
