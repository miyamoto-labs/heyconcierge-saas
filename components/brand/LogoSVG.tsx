export default function LogoSVG({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill="#6C5CE7"/>
      <g stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M16 5c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z"/>
        <path d="M7 15c0-5 4-9 9-9s9 4 9 9v1H7v-1z"/>
        <rect x="5" y="18" width="22" height="4" rx="1.5"/>
      </g>
    </svg>
  )
}
