export default function MascotSVG({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 400" fill="none">
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A29BFE"/>
          <stop offset="100%" stopColor="#6C5CE7"/>
        </linearGradient>
        <linearGradient id="cheekGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB8B8"/>
          <stop offset="100%" stopColor="#FF9B9B"/>
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="220" rx="140" ry="152" fill="url(#bodyGrad)"/>
      <ellipse cx="200" cy="240" rx="88" ry="96" fill="#E8E4FF" opacity="0.6"/>
      <ellipse cx="112" cy="88" rx="40" ry="56" fill="#6C5CE7" transform="rotate(-15 112 88)"/>
      <ellipse cx="112" cy="88" rx="24" ry="36" fill="#FFB8B8" transform="rotate(-15 112 88)"/>
      <ellipse cx="288" cy="88" rx="40" ry="56" fill="#6C5CE7" transform="rotate(15 288 88)"/>
      <ellipse cx="288" cy="88" rx="24" ry="36" fill="#FFB8B8" transform="rotate(15 288 88)"/>
      <circle cx="200" cy="152" r="100" fill="url(#bodyGrad)"/>
      <circle cx="200" cy="160" r="76" fill="#F0EDFF"/>
      <ellipse cx="168" cy="144" rx="16" ry="20" fill="#2D2B55"/>
      <ellipse cx="232" cy="144" rx="16" ry="20" fill="#2D2B55"/>
      <circle cx="172" cy="136" r="6" fill="white"/>
      <circle cx="236" cy="136" r="6" fill="white"/>
      <ellipse cx="136" cy="172" rx="20" ry="12" fill="url(#cheekGrad)" opacity="0.5"/>
      <ellipse cx="264" cy="172" rx="20" ry="12" fill="url(#cheekGrad)" opacity="0.5"/>
      <path d="M176 176 Q200 200 224 176" fill="none" stroke="#2D2B55" strokeWidth="5" strokeLinecap="round"/>
      <ellipse cx="200" cy="80" rx="72" ry="16" fill="#FF6B6B"/>
      <rect x="152" y="48" width="96" height="36" rx="8" fill="#FF6B6B"/>
      <circle cx="200" cy="48" r="10" fill="#FDCB6E"/>
      <ellipse cx="80" cy="220" rx="24" ry="16" fill="#A29BFE" transform="rotate(-30 80 220)"/>
      <ellipse cx="320" cy="200" rx="24" ry="16" fill="#A29BFE" transform="rotate(20 320 200)"/>
    </svg>
  )
}
