import React, { useRef, useEffect } from 'react';
import type { Paper } from '../services/api';
import { PaperCard } from './PaperCard';
import { Loader2 } from 'lucide-react';

interface FeedProps {
  papers: Paper[];
  currentIndex: number;
  savedIds: Set<string>;
  isLoading: boolean;
  onIndexChange: (index: number) => void;
  onToggleSave: (paper: Paper) => void;
  onLoadMore: () => void;
}

export const Feed: React.FC<FeedProps> = ({
  papers,
  currentIndex,
  savedIds,
  isLoading,
  onIndexChange,
  onToggleSave,
  onLoadMore
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor scroll to detect current active card index
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const clientHeight = containerRef.current.clientHeight;
    if (clientHeight === 0) return;
    
    const index = Math.round(scrollTop / clientHeight);
    if (index >= 0 && index < papers.length && index !== currentIndex) {
      onIndexChange(index);
    }
  };

  // Trigger load more when user is near the bottom
  useEffect(() => {
    if (currentIndex >= papers.length - 2 && papers.length > 0 && !isLoading) {
      onLoadMore();
    }
  }, [currentIndex, papers.length, isLoading, onLoadMore]);

  // Adjust scroll position if index is set programmatically (e.g. via search select)
  useEffect(() => {
    if (!containerRef.current || papers.length === 0) return;
    const currentScrollIndex = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
    if (currentScrollIndex !== currentIndex) {
      containerRef.current.scrollTo({
        top: currentIndex * containerRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, papers.length]);

  if (papers.length === 0 && isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0F] text-neutral-400 gap-3">
        {/* Full-page skeleton shimmer cards */}
        <div className="w-full h-full relative overflow-hidden flex flex-col justify-between p-6 bg-[#0E0E15]">
          <div className="flex justify-between items-center mt-4">
            <div className="h-6 w-20 bg-neutral-900 rounded-full animate-shimmer" />
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-neutral-900 rounded-full animate-shimmer" />
              <div className="h-10 w-10 bg-neutral-900 rounded-full animate-shimmer" />
            </div>
          </div>
          <div className="flex flex-col justify-end flex-grow mb-16 max-w-lg">
            <div className="h-7 w-5/6 bg-neutral-900 rounded-md animate-shimmer mb-3" />
            <div className="h-7 w-3/4 bg-neutral-900 rounded-md animate-shimmer mb-6" />
            <div className="h-4 w-1/3 bg-neutral-900 rounded-md animate-shimmer mb-6" />
            <div className="space-y-3">
              <div className="h-4 bg-neutral-900 rounded-md animate-shimmer w-full" />
              <div className="h-4 bg-neutral-900 rounded-md animate-shimmer w-11/12" />
              <div className="h-4 bg-neutral-900 rounded-md animate-shimmer w-4/5" />
            </div>
          </div>
          <div className="h-12 bg-neutral-900 rounded-xl animate-shimmer mb-16 w-full" />
        </div>
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0F] text-neutral-500 p-6">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Feed is empty</p>
        <p className="text-xs text-neutral-600 mt-1">Check your network or adjust your search queries.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth relative"
    >
      {papers.map((paper, index) => (
        <PaperCard
          key={paper.id}
          paper={paper}
          isActive={index === currentIndex}
          isSaved={savedIds.has(paper.id)}
          onToggleSave={onToggleSave}
        />
      ))}

      {/* Infinite loading spinner at the bottom of the feed */}
      {isLoading && (
        <div className="w-full h-screen snap-start flex flex-col items-center justify-center bg-[#0A0A0F] text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-[10px] font-mono mt-2 uppercase tracking-widest text-neutral-500">
            Fetching next papers...
          </span>
        </div>
      )}
    </div>
  );
};
