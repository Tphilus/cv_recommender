interface ScoreRingProps {
  score: number;     
  size?: number;     
}

export default function ScoreRing({ score, size = 80 }: ScoreRingProps) {
  const r = size * 0.45;
  const strokeW = size * 0.1;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center flex-none"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeW} />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span
        className="font-bold text-foreground"
        style={{ fontSize: size * 0.26 }}
      >
        {score}
      </span>
    </div>
  );
}
