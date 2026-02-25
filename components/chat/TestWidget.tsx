'use client'

export default function TestWidget() {
  return (
    <button 
      className="fixed bottom-6 right-6 w-16 h-16 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-50"
      onClick={() => alert('Widget works!')}
    >
      TEST
    </button>
  )
}
