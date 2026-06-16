import React, { useState, useEffect } from 'react';
import { TrendingUp, X, Loader2, Sparkles, Award } from 'lucide-react';
import { fetchTrendingPapers, type Paper } from '../services/api';

interface TrendingProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (paper: Paper) => void;
}

export const Trending: React.FC<TrendingProps> = ({ isOpen, onClose, onSelectPaper }) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDomain, setActiveDomain] = useState<string>('All');

  const domains = [
    'All', 'Computer Science', 'Biology', 'Medicine', 'Physics', 
    'Astronomy', 'Neuroscience', 'Environmental Science', 'Economics'
  ];

  useEffect(() => {
    const getTrending = async () => {
      if (!isOpen) return;
      setLoading(true);
      const filter = activeDomain === 'All' ? undefined : activeDomain;
      const trendingResults = await fetchTrendingPapers(filter, 20);
      setPapers(trendingResults);
      setLoading(false);
    };

    getTrending();
  }, [isOpen, activeDomain]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-md flex flex-col p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-900 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-lg text-white">Trending Research</h3>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Domain filters horizontal bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 flex-shrink-0">
        {domains.map((dom) => (
          <button
            key={dom}
            onClick={() => setActiveDomain(dom)}
            className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
              activeDomain === dom
                ? 'bg-indigo-600 border-indigo-550 text-white shadow-lg shadow-indigo-600/15'
                : 'bg-neutral-900 border-neutral-850 text-neutral-450 hover:text-white'
            }`}
          >
            {dom}
          </button>
        ))}
      </div>

      {/* Trending List */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1 mt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs font-mono">Measuring citation velocities...</span>
          </div>
        ) : papers.length > 0 ? (
          papers.map((paper, idx) => (
            <div
              key={paper.id}
              onClick={() => onSelectPaper(paper)}
              className="group p-4 bg-neutral-900/20 hover:bg-neutral-900/50 border border-neutral-900/60 hover:border-neutral-800 rounded-2xl flex justify-between items-center transition-all cursor-pointer"
            >
              <div className="max-w-[78%] text-left flex items-start gap-3">
                {/* Ranking index */}
                <span className="font-mono text-sm font-bold text-neutral-600 group-hover:text-indigo-400/70 transition-colors mt-0.5 w-5 flex-shrink-0 text-center">
                  #{idx + 1}
                </span>

                <div className="flex-grow">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] uppercase tracking-wider bg-neutral-900 text-cyan-400 border border-neutral-850 px-1.5 py-0.5 rounded font-mono">
                      {paper.domain}
                    </span>
                    {paper.citationCount > 500 && (
                      <span className="text-[8px] bg-amber-500/10 text-amber-450 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                        <Award className="w-2.5 h-2.5" /> High Impact
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-indigo-350 transition-colors line-clamp-2 leading-snug">
                    {paper.title}
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-mono mt-1 uppercase">
                    {paper.journal} · {paper.year}
                  </p>
                </div>
              </div>

              {/* Velocity Metric */}
              <div className="text-right flex-shrink-0 flex flex-col items-end">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  +{paper.citationVelocity}
                </span>
                <span className="text-[7px] text-neutral-500 font-mono uppercase tracking-tighter">
                  cits / month
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-2">
            <Sparkles className="w-5 h-5 text-neutral-600" />
            <p className="text-xs">No trending papers found in this category.</p>
            <p className="text-[10px] text-neutral-600">Try switching domains or reload later.</p>
          </div>
        )}
      </div>
    </div>
  );
};
