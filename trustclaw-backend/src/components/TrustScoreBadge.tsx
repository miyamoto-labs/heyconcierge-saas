export function TrustScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <span 
      className={`${getColor()} text-white px-2 py-1 rounded-full text-xs font-bold`}
    >
      {score}%
    </span>
  );
}