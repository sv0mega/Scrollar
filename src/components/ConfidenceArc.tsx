import React, { useEffect, useState } from 'react';

interface ConfidenceArcProps {
  citations: number;
  isActive: boolean;
}

export const ConfidenceArc: React.FC<ConfidenceArcProps> = ({ citations, isActive }) => {
  const [progress, setProgress] = useState(0);

  // Map citations logarithmically from 0 to 1000+
  // 0 -> 0%
  // 10 -> 33%
  // 100 -> 66%
  // 1000+ -> 100%
  const targetPercent = Math.min(
    100,
    Math.max(5, Math.log10(citations + 1) * 33.3)
  );

  useEffect(() => {
    if (isActive) {
      // Trigger animation after brief delay when card is selected
      const timer = setTimeout(() => {
        setProgress(targetPercent);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setProgress(0);
    }
  }, [isActive, targetPercent]);

  // SVG parameters
  const radius = 22;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Format citation number nicely (e.g. 1.2k, 450)
  const formatCitations = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-16 h-16 group">
      <svg className="w-14 h-14 transform -rotate-90">
        {/* Track */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="stroke-neutral-800 fill-none"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="stroke-cyan-400 fill-none transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      {/* Label in the center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[10px] font-bold text-cyan-400 leading-none">
          {formatCitations(citations)}
        </span>
        <span className="text-[7px] text-neutral-400 uppercase tracking-tighter leading-none mt-0.5">
          cits
        </span>
      </div>
    </div>
  );
};
