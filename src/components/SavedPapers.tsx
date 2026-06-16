import React from 'react';
import { Heart, X, Trash2, ArrowRight } from 'lucide-react';
import type { Paper } from '../services/api';

interface SavedPapersProps {
  isOpen: boolean;
  savedList: Paper[];
  onClose: () => void;
  onSelectPaper: (paper: Paper) => void;
  onRemovePaper: (paper: Paper) => void;
}

export const SavedPapers: React.FC<SavedPapersProps> = ({ 
  isOpen, 
  savedList, 
  onClose, 
  onSelectPaper, 
  onRemovePaper 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-md flex flex-col p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-900 mb-6">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          <h3 className="font-semibold text-lg text-white">Saved Publications ({savedList.length})</h3>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bookmarks List */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
        {savedList.length > 0 ? (
          savedList.map((paper) => (
            <div
              key={paper.id}
              onClick={() => onSelectPaper(paper)}
              className="group p-4 bg-neutral-900/20 hover:bg-neutral-900/50 border border-neutral-900/60 hover:border-neutral-800 rounded-2xl flex justify-between items-center transition-all cursor-pointer"
            >
              <div className="max-w-[80%] text-left">
                <span className="text-[9px] uppercase tracking-wider bg-neutral-900 text-indigo-400 border border-neutral-850 px-1.5 py-0.5 rounded font-mono block w-max mb-1.5">
                  {paper.domain}
                </span>
                <h4 className="text-sm font-semibold text-white group-hover:text-indigo-350 transition-colors line-clamp-2 leading-snug">
                  {paper.title}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                  {paper.authors.join(', ')}
                </p>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5 uppercase">
                  {paper.journal} · {paper.year}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2" data-html2canvas-ignore>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePaper(paper);
                  }}
                  className="p-2.5 rounded-full bg-neutral-900 hover:bg-red-500/10 border border-neutral-850 hover:border-red-500/30 text-neutral-500 hover:text-red-400 transition-all"
                  title="Remove Bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="p-2.5 rounded-full bg-neutral-900 border border-neutral-850 group-hover:bg-indigo-600 group-hover:border-indigo-550 transition-all text-neutral-450 group-hover:text-white">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-neutral-600 gap-2">
            <Heart className="w-8 h-8 text-neutral-750" />
            <p className="text-sm font-semibold">Your library is empty</p>
            <p className="text-xs text-neutral-650 max-w-[200px] text-center leading-normal">
              Double-tap cards in the feed or tap the heart icon to save papers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
