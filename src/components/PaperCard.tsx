import React, { useState, useEffect, useRef } from 'react';
import { Heart, Share2, FileText, ChevronUp, Copy, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import type { Paper } from '../services/api';
import { getPaperSummary, type AISummary } from '../services/ai';
import { ConfidenceArc } from './ConfidenceArc';
import html2canvas from 'html2canvas';

interface PaperCardProps {
  paper: Paper;
  isActive: boolean;
  isSaved: boolean;
  onToggleSave: (paper: Paper) => void;
}

// Word-by-word streaming component
const StreamingText: React.FC<{ text: string; delay?: number; onComplete?: () => void }> = ({ text, delay = 25, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    if (!text) return;
    
    const words = text.split(' ');
    let currentIdx = 0;
    
    const interval = setInterval(() => {
      if (currentIdx < words.length) {
        setDisplayedText((prev) => (prev ? prev + ' ' : '') + words[currentIdx]);
        currentIdx++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, delay);
    
    return () => clearInterval(interval);
  }, [text, delay]);

  return <span>{displayedText}</span>;
};

export const PaperCard: React.FC<PaperCardProps> = ({ paper, isActive, isSaved, onToggleSave }) => {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showAbstract, setShowAbstract] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  // Load summary when card becomes active
  useEffect(() => {
    if (isActive && !summary && !isLoadingSummary) {
      const fetchSummary = async () => {
        setIsLoadingSummary(true);
        const apiKey = localStorage.getItem('rr_anthropic_api_key') || '';
        const proxyUrl = localStorage.getItem('rr_proxy_url') || 'http://localhost:3001';
        
        const res = await getPaperSummary(paper.title, paper.abstract, apiKey, proxyUrl);
        setSummary(res);
        setIsLoadingSummary(false);
      };
      
      fetchSummary();
    }
  }, [isActive, paper, summary, isLoadingSummary]);

  // Double tap to save paper
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (!isSaved) {
        onToggleSave(paper);
      }
      setShowHeartOverlay(true);
      setTimeout(() => setShowHeartOverlay(false), 800);
    }
    lastTapRef.current = now;
  };

  // Capture screen and download as image
  const handleShareCard = async () => {
    if (!cardRef.current) return;
    try {
      // Find buttons to hide during capture
      const ignoreElements = cardRef.current.querySelectorAll('[data-html2canvas-ignore]');
      ignoreElements.forEach(el => el.setAttribute('style', 'display: none !important'));

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A0A0F',
        scale: 2, // Retains high fidelity
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Restore button display
      ignoreElements.forEach(el => el.removeAttribute('style'));

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${paper.title.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}_reel.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture card image:', err);
      // Fallback: use Web Share if supported, or copy link
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    const citation = `${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' et al.' : ''} (${paper.year}). ${paper.title}. ${paper.journal}.`;
    const shareText = `📚 Discovering on Research Reel: "${paper.title}"\n\nCitation: ${citation}\n${paper.doi ? `DOI: https://doi.org/${paper.doi}` : ''}`;
    
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theme values depending on Domain Classification
  const domain = summary?.domain || paper.domain || 'Computer Science';
  
  const getDomainTheme = (d: string) => {
    switch (d) {
      case 'Biology':
        return {
          bgGradient: 'from-emerald-950/50 via-[#0A0A0F]/95 to-[#0A0A0F]',
          tagClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          accentColor: '#10B981',
          gradientHex: 'linear-gradient(180deg, rgba(6, 78, 59, 0.4) 0%, rgba(10, 10, 15, 0.95) 60%, #0A0A0F 100%)'
        };
      case 'Medicine':
        return {
          bgGradient: 'from-teal-950/50 via-[#0A0A0F]/95 to-[#0A0A0F]',
          tagClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          accentColor: '#14B8A6',
          gradientHex: 'linear-gradient(180deg, rgba(20, 110, 120, 0.4) 0%, rgba(10, 10, 15, 0.95) 60%, #0A0A0F 100%)'
        };
      case 'Physics':
        return {
          bgGradient: 'from-blue-950/50 via-[#0A0A0F]/95 to-[#0A0A0F]',
          tagClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          accentColor: '#3B82F6',
          gradientHex: 'linear-gradient(180deg, rgba(30, 58, 138, 0.4) 0%, rgba(10, 10, 15, 0.95) 60%, #0A0A0F 100%)'
        };
      case 'Astronomy':
        return {
          bgGradient: 'from-violet-950/50 via-[#0A0A0F]/95 to-[#0A0A0F]',
          tagClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          accentColor: '#8B5CF6',
          gradientHex: 'linear-gradient(180deg, rgba(88, 28, 135, 0.4) 0%, rgba(10, 10, 15, 0.95) 60%, #0A0A0F 100%)'
        };
      case 'Neuroscience':
        return {
          bgGradient: 'from-fuchsia-950/50 via-[#0A0A0F]/95 to-[#0A0A0F]',
          tagClass: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
          accentColor: '#D946EF',
          gradientHex: 'linear-gradient(180deg, rgba(74, 4, 78, 0.4) 0%, rgba(10, 10, 15, 0.95) 60%, #0A0A0F 100%)'
        };
      case 'Environmental Science':
        return {
          bgGradient: 'from-green-950/50 via-[#0A0A0F]/95 to-[#0A0A0F]',
          tagClass: 'bg-green-500/10 text-green-400 border-green-500/20',
          accentColor: '#22C55E',
          gradientHex: 'linear-gradient(180deg, rgba(20, 83, 45, 0.4) 0%, rgba(10, 10, 15, 0.95) 60%, #0A0A0F 100%)'
        };
      case 'Economics':
        return {
          bgGradient: 'from-amber-950/40 via-[#0A0A0F]/95 to-[#0A0A0F]',
          tagClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          accentColor: '#F59E0B',
          gradientHex: 'linear-gradient(180deg, rgba(120, 53, 15, 0.3) 0%, rgba(10, 10, 15, 0.95) 60%, #0A0A0F 100%)'
        };
      default: // Computer Science / Math
        return {
          bgGradient: 'from-indigo-950/50 via-[#0A0A0F]/95 to-[#0A0A0F]',
          tagClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          accentColor: '#6366F1',
          gradientHex: 'linear-gradient(180deg, rgba(49, 46, 129, 0.4) 0%, rgba(10, 10, 15, 0.95) 60%, #0A0A0F 100%)'
        };
    }
  };

  const theme = getDomainTheme(domain);

  return (
    <div 
      ref={cardRef}
      className={`w-full h-full snap-start snap-always relative overflow-hidden flex flex-col justify-between p-6 select-none bg-[#0A0A0F]`}
      onClick={handleDoubleTap}
    >
      {/* Background Gradient Map Overlay */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: theme.gradientHex }}
      />

      {/* Grid Pattern Overlay for Premium monospaced tech look */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Heart Pop Animation on Double Tap */}
      {showHeartOverlay && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-[ping_0.8s_ease-in-out_infinite]">
          <Heart className="w-24 h-24 text-red-500 fill-red-500 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
        </div>
      )}

      {/* Card Header (Floating Tag + Share/Save top bar) */}
      <div className="relative z-10 flex items-center justify-between w-full mt-4" data-html2canvas-ignore>
        <span className={`px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-widest rounded-full border ${theme.tagClass}`}>
          {domain}
        </span>
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleSave(paper); }}
            className={`p-2.5 rounded-full border transition-all duration-300 ${
              isSaved 
                ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            <Heart className={`w-4.5 h-4.5 ${isSaved ? 'fill-red-400' : ''}`} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleShareCard(); }}
            className="p-2.5 rounded-full border bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all"
            title="Download Card Image"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Card Body (Paper Title & Meta + AI TL;DR + Key Findings) */}
      <div className="relative z-10 flex flex-col justify-end flex-grow mb-6 max-w-lg mt-6">
        
        {/* Title & Metadata */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2 leading-snug line-clamp-3">
            {paper.title}
          </h2>
          <p className="text-xs text-neutral-400 font-sans line-clamp-1">
            {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}
          </p>
          <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mt-1">
            {paper.journal} · {paper.year}
          </p>
        </div>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-neutral-800/80 via-neutral-700/30 to-transparent w-full mb-6" />

        {/* Skeleton Shimmer or Real Claude AI content */}
        {isLoadingSummary ? (
          <div className="space-y-4 w-full">
            <div className="h-4 bg-neutral-900 rounded-md animate-shimmer w-3/4" />
            <div className="h-4 bg-neutral-900 rounded-md animate-shimmer w-5/6" />
            <div className="h-3 bg-neutral-900 rounded-md animate-shimmer w-1/2 mt-6" />
            <div className="h-4 bg-neutral-900 rounded-md animate-shimmer w-full" />
            <div className="h-4 bg-neutral-900 rounded-md animate-shimmer w-full" />
            <div className="h-4 bg-neutral-900 rounded-md animate-shimmer w-4/5" />
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* TL;DR Section */}
            <div>
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                <Sparkles className="w-3.5 h-3.5" /> Summary (TL;DR)
              </div>
              <p className="text-neutral-250 text-sm md:text-[15px] leading-relaxed">
                {isActive ? (
                  <StreamingText text={summary.tldr} delay={20} />
                ) : (
                  summary.tldr
                )}
              </p>
            </div>

            {/* Key Findings Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3 font-mono">
                <BookOpen className="w-3.5 h-3.5" /> Key Findings
              </div>
              <ul className="space-y-2.5 text-neutral-300 text-[13px] md:text-sm">
                {summary.findings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span 
                      className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    <span>
                      {isActive ? (
                        <StreamingText text={finding} delay={22} />
                      ) : (
                        finding
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-neutral-500 text-xs italic">
            Summary failed to compile. Tap to retry.
          </p>
        )}

      </div>

      {/* Card Footer (Stats bar + Abstract trigger) */}
      <div className="relative z-10 w-full mb-14">
        
        {/* Actions bar (Citations arc, Views/Complexity, Open Access) */}
        <div className="flex items-center justify-between w-full py-3 border-t border-neutral-900/60 bg-neutral-950/20 backdrop-blur-xs px-2 rounded-xl mb-4">
          <div className="flex items-center gap-3">
            {/* Citations confidence dial */}
            <ConfidenceArc citations={paper.citationCount} isActive={isActive} />
            
            {/* Complexity Indicator */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono">Complexity</span>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div 
                    key={lvl}
                    className={`w-3 h-1.5 rounded-xs transition-colors duration-500 ${
                      lvl <= (summary?.complexity || paper.complexity || 3)
                        ? 'bg-cyan-400' 
                        : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2" data-html2canvas-ignore>
            {/* Copy citation details */}
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 text-xs font-medium font-mono text-neutral-400 hover:text-white bg-neutral-900/60 border border-neutral-850 rounded-lg flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied' : 'Cite'}
            </button>

            {/* Link to OpenAccess PDF */}
            {paper.openAccessPdf ? (
              <a
                href={paper.openAccessPdf}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-2 text-xs font-semibold text-[#0A0A0F] bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </a>
            ) : paper.doi ? (
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-2 text-xs font-medium font-mono text-neutral-400 hover:text-white bg-neutral-900/60 border border-neutral-850 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> DOI
              </a>
            ) : (
              <span className="text-[10px] text-neutral-500 uppercase font-mono">
                No Link
              </span>
            )}
          </div>
        </div>

        {/* Read Full Abstract trigger */}
        <button 
          data-html2canvas-ignore
          onClick={(e) => { e.stopPropagation(); setShowAbstract(true); }}
          className="w-full text-center py-2 text-neutral-400 hover:text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer"
        >
          Read Full Abstract <ChevronUp className="w-4 h-4 animate-bounce" />
        </button>
      </div>

      {/* Slide-Up Abstract Drawer */}
      {showAbstract && (
        <div 
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-end transition-all duration-300"
          onClick={(e) => { e.stopPropagation(); setShowAbstract(false); }}
          data-html2canvas-ignore
        >
          <div 
            className="w-full max-h-[70%] bg-[#0F0F16] border-t border-neutral-850 rounded-t-3xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-neutral-900 mb-4">
              <span className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-bold">Full Academic Abstract</span>
              <button 
                onClick={() => setShowAbstract(false)}
                className="text-xs font-semibold text-neutral-400 hover:text-white uppercase font-mono cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed text-left font-sans select-text">
              {paper.abstract}
            </p>
            {paper.doi && (
              <div className="mt-6 pt-4 border-t border-neutral-900 flex justify-between items-center text-xs text-neutral-500 font-mono">
                <span>DOI: {paper.doi}</span>
                <a 
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  Crossref <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
