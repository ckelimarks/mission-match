'use client';

type RadarChartProps = {
  personA: { [key: string]: number }; // axis name -> score (0-100)
  personB: { [key: string]: number };
  size?: number;
};

export default function RadarChart({ personA, personB, size = 300 }: RadarChartProps) {
  const axes = Object.keys(personA);
  const numAxes = axes.length;
  const center = size / 2;
  const maxRadius = (size / 2) - 40;

  // Convert score (0-100) to radius
  const scoreToRadius = (score: number) => (score / 100) * maxRadius;

  // Get point on circle for given angle and radius
  const polarToCartesian = (angle: number, radius: number) => {
    const angleRad = (angle - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(angleRad),
      y: center + radius * Math.sin(angleRad),
    };
  };

  // Create polygon path for a profile
  const createPath = (profile: { [key: string]: number }) => {
    const points = axes.map((axis, i) => {
      const angle = (360 / numAxes) * i;
      const radius = scoreToRadius(profile[axis] || 0);
      return polarToCartesian(angle, radius);
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';

    return pathData;
  };

  return (
    <div className="relative">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background circles */}
        {[20, 40, 60, 80, 100].map((percent) => (
          <circle
            key={percent}
            cx={center}
            cy={center}
            r={scoreToRadius(percent)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-grid-line"
            opacity="0.3"
          />
        ))}

        {/* Axes lines */}
        {axes.map((_, i) => {
          const angle = (360 / numAxes) * i;
          const end = polarToCartesian(angle, maxRadius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-grid-line"
              opacity="0.5"
            />
          );
        })}

        {/* Person B polygon (orange, behind) */}
        <path
          d={createPath(personB)}
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="2"
          className="text-accent-orange"
        />

        {/* Person A polygon (cyan, front) */}
        <path
          d={createPath(personA)}
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeWidth="2"
          className="text-accent-cyan"
        />

        {/* Axis labels */}
        {axes.map((axis, i) => {
          const angle = (360 / numAxes) * i;
          const labelPos = polarToCartesian(angle, maxRadius + 25);

          // Determine text anchor based on position
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (labelPos.x > center + 10) textAnchor = 'start';
          if (labelPos.x < center - 10) textAnchor = 'end';

          return (
            <text
              key={axis}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className="text-xs font-bold uppercase tracking-wider fill-text-primary"
            >
              {axis.replace(/_/g, ' ')}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-accent-cyan border-2 border-accent-cyan"></div>
          <span className="text-sm text-text-secondary">You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-accent-orange border-2 border-accent-orange"></div>
          <span className="text-sm text-text-secondary">Them</span>
        </div>
      </div>
    </div>
  );
}
