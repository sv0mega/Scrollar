import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, Sparkles, SlidersHorizontal, ArrowRight, FileText } from 'lucide-react';
import { searchPapers, type Paper } from '../services/api';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (paper: Paper) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isOpen, onClose, onSelectPaper }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [yearRange, setYearRange] = useState('all');

  const domains = [
    'Computer Science', 'Biology', 'Medicine', 'Physics', 
    'Astronomy', 'Neuroscience', 'Environmental Science', 'Economics'
  ];

  // Debounced Search Call
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const searchResults = await searchPapers(query);
      setResults(searchResults);
      setLoading(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  // Apply filters client-side to search results
  const filteredResults = results.filter((paper) => {
    // 1. Domain filter
    if (domainFilter && paper.domain !== domainFilter) return false;
    
    // 2. Open Access PDF filter
    if (openAccessOnly && !paper.openAccessPdf) return false;
    
    // 3. Year range filter
    const currentYear = new Date().getFullYear();
    if (yearRange === 'recent' && paper.year < currentYear - 2) return false;
    if (yearRange === 'older' && paper.year >= currentYear - 2) return false;

    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-[#0A0A0F]/95 backdrop-blur-md flex flex-col p-6 animate-fade-in-up">
      {/* Search Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-900 mb-6">
        <h3 className="font-semibold text-lg text-white">Search Academic Papers</h3>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Input box */}
      <div className="relative flex items-center mb-4">
        <Search className="absolute left-4 w-4.5 h-4.5 text-neutral-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics, author names, or keywords..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-12 pr-10 py-3 text-sm text-white placeholder-neutral-550 focus:outline-none focus:border-indigo-500"
          autoFocus
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-4 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Toggle Advanced Filters */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 text-xs font-mono py-1 px-3 rounded-lg border transition-all ${
            showFilters 
              ? 'bg-indigo-600/10 border-indigo-550 text-indigo-400' 
              : 'bg-neutral-900/60 border-neutral-850 text-neutral-450 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
        </button>
        {query && !loading && (
          <span className="text-[10px] text-neutral-500 font-mono uppercase">
            {filteredResults.length} matches found
          </span>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-4 mb-4 space-y-4">
          {/* Domain Chips */}
          <div>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2 font-mono">
              Filter by Research Domain
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDomainFilter(null)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition-colors ${
                  domainFilter === null
                    ? 'bg-indigo-600 border-indigo-550 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                All Domains
              </button>
              {domains.map((dom) => (
                <button
                  key={dom}
                  onClick={() => setDomainFilter(dom)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition-colors ${
                    domainFilter === dom
                      ? 'bg-indigo-600 border-indigo-550 text-white'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Year filter */}
            <div>
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2 font-mono">
                Publication Year
              </span>
              <select
                value={yearRange}
                onChange={(e) => setYearRange(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Years</option>
                <option value="recent">Recent (Last 2 years)</option>
                <option value="older">Older</option>
              </select>
            </div>

            {/* Open Access Toggle */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs text-neutral-350 cursor-pointer select-none py-2">
                <input
                  type="checkbox"
                  checked={openAccessOnly}
                  onChange={(e) => setOpenAccessOnly(e.target.checked)}
                  className="rounded border-neutral-800 bg-neutral-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                Open Access PDF Only
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Results Container */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs font-mono">Quarrying academic repositories...</span>
          </div>
        ) : filteredResults.length > 0 ? (
          filteredResults.map((paper) => (
            <div
              key={paper.id}
              onClick={() => onSelectPaper(paper)}
              className="group p-4 bg-neutral-900/30 hover:bg-neutral-900/60 border border-neutral-900 hover:border-neutral-800 rounded-2xl flex justify-between items-center transition-all cursor-pointer"
            >
              <div className="max-w-[85%] text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] uppercase tracking-wider bg-neutral-900 text-indigo-400 border border-neutral-800 px-1.5 py-0.5 rounded font-mono">
                    {paper.domain}
                  </span>
                  {paper.openAccessPdf && (
                    <span className="text-[9px] text-emerald-450 font-mono flex items-center gap-0.5">
                      <FileText className="w-2.5 h-2.5" /> PDF
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-white group-hover:text-indigo-350 transition-colors line-clamp-2 leading-snug">
                  {paper.title}
                </h4>
                <p className="text-[11px] text-neutral-450 mt-1 line-clamp-1">
                  {paper.authors.join(', ')} · {paper.year}
                </p>
              </div>
              <div className="p-2 rounded-full bg-neutral-900 border border-neutral-850 group-hover:bg-indigo-600 group-hover:border-indigo-550 transition-all text-neutral-400 group-hover:text-white">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))
        ) : query ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-2">
            <Sparkles className="w-5 h-5 text-neutral-600" />
            <p className="text-xs">No papers match your search parameters.</p>
            <p className="text-[10px] text-neutral-600">Try modifying filters or checking spelling.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-600 gap-1.5">
            <Search className="w-8 h-8 text-neutral-700 mb-1" />
            <p className="text-xs font-mono">Type a query to search publications</p>
            <p className="text-[10px] text-neutral-700">Powered by Semantic Scholar API</p>
          </div>
        )}
      </div>
    </div>
  );
};
