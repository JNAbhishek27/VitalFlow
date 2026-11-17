interface TraceSparklineProps {
  values: number[];
  strokeColor?: string;
  height?: number;
  label: string;
}

export function TraceSparkline({
  values,
  strokeColor = '#38BDF8',
  height = 42,
  label,
}: TraceSparklineProps) {
  const width = 240;

  if (values.length < 3) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-slate-800/70 bg-slate-950/40 text-xs text-slate-500"
        style={{ height }}
      >
        Waiting for {label.toLowerCase()} waveform...
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((val, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const y = height - 4 - ((val - min) / range) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full overflow-visible rounded-lg border border-slate-800/60 bg-slate-950/40"
      style={{ height }}
      role="img"
      aria-label={`${label} real-time waveform`}
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
