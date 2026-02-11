export default function LogoSVG({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="35" fill="#6C5CE7"/>
      <circle cx="50" cy="53" r="24" fill="#F0EDFF"/>
      <ellipse cx="42" cy="48" rx="4" ry="5" fill="#2D2B55"/>
      <ellipse cx="58" cy="48" rx="4" ry="5" fill="#2D2B55"/>
      <circle cx="43" cy="46" r="1.5" fill="white"/>
      <circle cx="59" cy="46" r="1.5" fill="white"/>
      <path d="M44 57 Q50 62 56 57" stroke="#2D2B55" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <ellipse cx="35" cy="55" rx="5" ry="3" fill="#FFB8B8" opacity="0.5"/>
      <ellipse cx="65" cy="55" rx="5" ry="3" fill="#FFB8B8" opacity="0.5"/>
      <rect x="38" y="18" width="24" height="10" rx="3" fill="#FF6B6B"/>
      <circle cx="50" cy="17" r="3" fill="#FDCB6E"/>
    </svg>
  )
}
