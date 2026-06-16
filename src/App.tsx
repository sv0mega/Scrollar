import { useState, useEffect, useCallback } from 'react';
import { Home, Search, TrendingUp, Heart, Settings, Sparkles, ChevronRight, GraduationCap, Globe, BookOpen, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { fetchTrendingPapers, type Paper } from './services/api';
import { Feed } from './components/Feed';
import { SearchBar } from './components/SearchBar';
import { Trending } from './components/Trending';
import { SavedPapers } from './components/SavedPapers';
import { SettingsDrawer } from './components/SettingsDrawer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';

// Curated high-quality fallback papers for offline / rate-limit safety
const FALLBACK_PAPERS: Paper[] = [
  {
    id: "ss-transformer2017",
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Łukasz Kaiser", "Illia Polosukhin"],
    journal: "Advances in Neural Information Processing Systems (NeurIPS)",
    year: 2017,
    abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The dominant models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU.",
    citationCount: 135400,
    citationVelocity: 4200,
    openAccessPdf: "https://arxiv.org/pdf/1706.03762.pdf",
    domain: "Computer Science"
  },
  {
    id: "ss-crispr2012",
    title: "A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity",
    authors: ["Martin Jinek", "Krzysztof Chylinski", "Ines Fonfara", "Michael Hauer", "Jennifer A. Doudna", "Emmanuelle Charpentier"],
    journal: "Science",
    year: 2012,
    abstract: "Clustered regularly interspaced short palindromic repeats (CRISPR)/CRISPR-associated (Cas) systems provide bacteria and archaea with adaptive immunity against viruses and plasmids. Here, we show that the Cas9 endonuclease can be programmed with single guide RNAs to target and cleave specific DNA sequences. This simple dual-RNA-guided system offers high versatility for genomic engineering and genome editing applications in diverse organisms and cell types.",
    citationCount: 24500,
    citationVelocity: 350,
    openAccessPdf: "https://www.science.org/doi/pdf/10.1126/science.1225829",
    domain: "Biology"
  },
  {
    id: "ss-resnet2016",
    title: "Deep Residual Learning for Image Recognition",
    authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
    journal: "IEEE Conference on Computer Vision and Pattern Recognition (CVPR)",
    year: 2016,
    abstract: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from considerably increased depth. On the ImageNet dataset we evaluate residual nets with depth up to 152 layers—8x deeper than VGG nets but still having lower complexity. An ensemble of these residual nets achieves 3.57% error on the ImageNet test set. This result won the 1st place on the ILSVRC 2015 classification task.",
    citationCount: 198000,
    citationVelocity: 5500,
    openAccessPdf: "https://arxiv.org/pdf/1512.03385.pdf",
    domain: "Computer Science"
  },
  {
    id: "ss-superconductivity2020",
    title: "Evidence of Quantum Superconductivity in Carbonaceous Sulfur Hydride at Extreme Pressures",
    authors: ["Elliot Snider", "Nathan Dasenbrock-Gammon", "Raymond McBride", "Mathew Debessai", "Hiranya Vindana", "Kevin Vencatasamy", "Keith Lawler", "Ashkan Salamat", "Ranga P. Dias"],
    journal: "Nature",
    year: 2020,
    abstract: "One of the long-standing challenges in experimental physics is the realization of room-temperature superconductivity. Here, we report the discovery of quantum superconductivity in a photochemically synthesized organic carbonaceous sulfur hydride system. By compressing the material to pressures of 267 gigapascals, we observe a superconducting transition temperature of 287.7 kelvin (approximately 15 degrees Celsius). This represents the first demonstration of room-temperature electrical transport without resistance in a bulk solid.",
    citationCount: 920,
    citationVelocity: 15,
    domain: "Physics"
  }
];

function App() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [paperFeed, setPaperFeed] = useState<Paper[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedPapers, setSavedPapers] = useLocalStorage<Paper[]>('rr_saved_papers', []);
  const [isLoading, setIsLoading] = useState(false);

  // Overlay Menu triggers
  const [showSearch, setShowSearch] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Pagination for infinite scroll
  const [page, setPage] = useState(1);

  // Active navigation tab highlight
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'trending' | 'saved' | 'settings'>('home');

  // Load initial feed
  const loadInitialFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const trending = await fetchTrendingPapers(undefined, 15);
      if (trending.length > 0) {
        setPaperFeed(trending);
      } else {
        setPaperFeed(FALLBACK_PAPERS);
      }
    } catch (error) {
      console.warn("Failed to load live trending papers, using fallback papers", error);
      setPaperFeed(FALLBACK_PAPERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialFeed();
  }, [loadInitialFeed]);

  // Infinite scroll loader
  const loadMorePapers = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const morePapers = await fetchTrendingPapers(undefined, 10);
      if (morePapers.length > 0) {
        const existingIds = new Set(paperFeed.map(p => p.id));
        const uniqueMore = morePapers.filter(p => !existingIds.has(p.id));
        setPaperFeed(prev => [...prev, ...uniqueMore]);
        setPage(nextPage);
      }
    } catch (e) {
      console.error("Failed to load more papers", e);
    } finally {
      setIsLoading(false);
    }
  }, [page, paperFeed, isLoading]);

  const savedIds = new Set(savedPapers.map((p) => p.id));

  const handleToggleSave = (paper: Paper) => {
    if (savedIds.has(paper.id)) {
      setSavedPapers(savedPapers.filter((p) => p.id !== paper.id));
    } else {
      setSavedPapers([...savedPapers, paper]);
    }
  };

  const handleRemovePaper = (paper: Paper) => {
    setSavedPapers(savedPapers.filter((p) => p.id !== paper.id));
  };

  const handleSelectPaper = (paper: Paper) => {
    const feedIndex = paperFeed.findIndex((p) => p.id === paper.id);

    if (feedIndex !== -1) {
      setCurrentIndex(feedIndex);
    } else {
      const updatedFeed = [...paperFeed];
      updatedFeed.splice(currentIndex + 1, 0, paper);
      setPaperFeed(updatedFeed);
      setCurrentIndex(currentIndex + 1);
    }

    setShowSearch(false);
    setShowTrending(false);
    setShowSaved(false);
    setShowSettings(false);
    setActiveTab('home');
    setShowPlayer(true); // Automatically open the player if selected from search/trending
  };

  return (
    <AnimatePresence mode="wait">
      {!showPlayer ? (
        // STUNNING PREMIUM PRODUCT LANDING PAGE
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="w-full min-h-screen bg-[#0A0A0F] text-white flex flex-col font-sans overflow-y-auto relative"
        >
          {/* Subtle colorful mesh lights in background */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
          
          {/* Premium Monospaced Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_36px] pointer-events-none" />

          {/* Header */}
          <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-mono font-bold text-lg tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                RESEARCH REEL
              </span>
            </div>
            <button
              onClick={() => setShowPlayer(true)}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              Launch Player <ChevronRight className="w-4 h-4" />
            </button>
          </header>

          {/* Hero Section */}
          <main className="w-full max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 z-10 flex-grow justify-center">
            
            {/* Left Column: Text Content */}
            <div className="flex-1 text-left space-y-8 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-mono">
                <Sparkles className="w-3.5 h-3.5" /> Next-Gen Academic Discovery
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                TikTok for <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                  Academic Papers.
                </span>
              </h1>
              
              <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
                Swipe through distilled cutting-edge science. Research Reel transforms dense, 
                multi-page journals into beautiful, mobile-friendly cards featuring AI-generated TL;DR summaries, key findings, and citation velocity rings.
              </p>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-4 py-2">
                <div className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-3 text-left">
                  <div className="font-mono text-cyan-400 font-bold text-lg">200M+</div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider mt-0.5">Papers Indexed</div>
                </div>
                <div className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-3 text-left">
                  <div className="font-mono text-indigo-400 font-bold text-lg">Instant</div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider mt-0.5">AI Summaries</div>
                </div>
                <div className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-3 text-left">
                  <div className="font-mono text-emerald-400 font-bold text-lg">100%</div>
                  <div className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider mt-0.5">Open Access</div>
                </div>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={() => setShowPlayer(true)}
                  className="px-8 py-4 bg-indigo-655 hover:bg-indigo-550 text-white font-bold text-sm tracking-wider uppercase font-mono rounded-2xl shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Enter Reel Player <ArrowRight className="w-4.5 h-4.5" />
                </button>
                <a
                  href="https://github.com/semanticscholar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-4 bg-neutral-900/60 hover:bg-neutral-950 border border-neutral-850 hover:border-neutral-700 text-neutral-300 hover:text-white text-sm font-semibold rounded-2xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Globe className="w-4.5 h-4.5" /> Semantic Scholar
                </a>
              </div>
            </div>

            {/* Right Column: Simulated Visual Mockup */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative group">
                {/* Glow Behind Mockup */}
                <div className="absolute inset-0 bg-indigo-500/10 rounded-[40px] blur-2xl group-hover:bg-indigo-500/15 transition-colors pointer-events-none" />
                
                {/* Frame wrapper simulating phone */}
                <div className="w-[310px] h-[550px] bg-[#0E0E15] border-[6px] border-neutral-800 rounded-[38px] shadow-2xl relative overflow-hidden flex flex-col p-4">
                  {/* Phone Speaker Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-neutral-850 rounded-b-xl z-20" />
                  
                  {/* Mini-mock Card Content */}
                  <div className="w-full h-full flex flex-col justify-between pt-4 pb-2 z-10 relative">
                    <div className="flex justify-between items-center text-[8px] font-mono border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 px-2 py-0.5 rounded-full w-max mt-1">
                      COMPUTER SCIENCE
                    </div>
                    
                    <div className="mt-8 text-left">
                      <h4 className="text-[13px] font-bold text-white leading-snug line-clamp-2">
                        Attention Is All You Need
                      </h4>
                      <p className="text-[9px] text-neutral-400 mt-1 font-sans line-clamp-1">
                        Ashish Vaswani, Noam Shazeer...
                      </p>
                      <p className="text-[8px] text-neutral-500 font-mono tracking-widest mt-0.5">
                        NEURIPS · 2017
                      </p>
                      
                      <div className="h-px bg-gradient-to-r from-neutral-800 to-transparent w-full my-3" />
                      
                      <div className="space-y-1">
                        <span className="text-[9px] text-indigo-400 font-bold font-mono uppercase">Summary</span>
                        <p className="text-[10px] text-neutral-300 leading-relaxed">
                          We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions.
                        </p>
                      </div>
                      
                      <div className="space-y-1.5 mt-3">
                        <span className="text-[9px] text-cyan-400 font-bold font-mono uppercase">Key Findings</span>
                        <div className="flex items-start gap-1 text-[9px] text-neutral-400">
                          <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                          <span>Dispenses with recurrent structures entirely.</span>
                        </div>
                        <div className="flex items-start gap-1 text-[9px] text-neutral-400">
                          <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                          <span>Highly parallelizable, reducing training times.</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-neutral-900 pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-full border border-cyan-400/40 flex items-center justify-center font-mono text-[8px] text-cyan-400 font-bold">
                          135k
                        </div>
                        <span className="text-[8px] font-mono text-neutral-500 uppercase">Cits</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md bg-cyan-400 text-[#0A0A0F] text-[8px] font-bold font-mono">
                        OPEN PDF
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Core App Pitch Columns */}
          <section className="w-full max-w-6xl mx-auto px-6 py-12 md:py-16 border-t border-neutral-900 bg-neutral-950/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="flex items-start gap-4 text-left">
                <div className="p-3 bg-indigo-500/10 border border-indigo-550/20 text-indigo-400 rounded-2xl flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">AI-Generated Summaries</h3>
                  <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">
                    Uses Claude 3.5 Sonnet to condense intricate paper drafts into a 2-sentence summary and 3 core findings.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 text-left">
                <div className="p-3 bg-cyan-500/10 border border-cyan-550/20 text-cyan-400 rounded-2xl flex-shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">Citation Velocity Dials</h3>
                  <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">
                    Visualizes the absolute impact of the publication dynamically with SVG circular progress meters scaled logarithmically.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 text-left">
                <div className="p-3 bg-emerald-500/10 border border-emerald-550/20 text-emerald-400 rounded-2xl flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">Open Access First</h3>
                  <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">
                    One-click download of PDF papers directly from Unpaywall, OpenAlex, and ArXiv source repositories.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Footer */}
          <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-neutral-900 text-xs text-neutral-500 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 font-mono">
            <span>© {new Date().getFullYear()} Research Reel Inc. Powered by OpenAlex.</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowPlayer(true)} className="hover:text-white transition-colors cursor-pointer">Launch Player</button>
              <a href="https://api.semanticscholar.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Semantic API</a>
              <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-mono">OpenAlex API</a>
            </div>
          </footer>
        </motion.div>
      ) : (
        // MOBILE-FIRST PORTABLE FEED READER
        <motion.div
          key="player"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md h-full bg-[#0A0A0F] relative flex flex-col justify-between overflow-hidden shadow-2xl border-x border-neutral-900"
        >
          {/* Back to Landing Page trigger */}
          <div className="absolute top-5 left-5 z-40" data-html2canvas-ignore>
            <button
              onClick={() => {
                setShowPlayer(false);
                setActiveTab('home');
              }}
              className="px-3 py-1.5 rounded-lg bg-neutral-950/60 backdrop-blur-xs border border-neutral-850 text-[10px] font-mono font-bold tracking-widest text-neutral-400 hover:text-white uppercase transition-colors cursor-pointer"
            >
              ← Web Home
            </button>
          </div>

          {/* Main Feed Section */}
          <div className="w-full h-full flex-grow overflow-hidden relative">
            <Feed
              papers={paperFeed}
              currentIndex={currentIndex}
              savedIds={savedIds}
              isLoading={isLoading}
              onIndexChange={setCurrentIndex}
              onToggleSave={handleToggleSave}
              onLoadMore={loadMorePapers}
            />
          </div>

          {/* Bottom Navigation Bar */}
          <nav 
            className="absolute bottom-0 left-0 right-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-md border-t border-neutral-950/60 pb-5 pt-3 flex justify-around items-center px-4"
            data-html2canvas-ignore
          >
            {/* Home */}
            <button
              onClick={() => {
                setActiveTab('home');
                setShowSearch(false);
                setShowTrending(false);
                setShowSaved(false);
                setShowSettings(false);
                if (currentIndex !== 0) setCurrentIndex(0);
              }}
              className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'home' ? 'text-indigo-400' : 'text-neutral-555 hover:text-neutral-300'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[9px] font-mono tracking-wider">Home</span>
            </button>

            {/* Search */}
            <button
              onClick={() => {
                setActiveTab('search');
                setShowSearch(true);
                setShowTrending(false);
                setShowSaved(false);
                setShowSettings(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'search' ? 'text-indigo-400' : 'text-neutral-555 hover:text-neutral-300'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="text-[9px] font-mono tracking-wider">Search</span>
            </button>

            {/* Trending */}
            <button
              onClick={() => {
                setActiveTab('trending');
                setShowTrending(true);
                setShowSearch(false);
                setShowSaved(false);
                setShowSettings(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'trending' ? 'text-indigo-400' : 'text-neutral-555 hover:text-neutral-300'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[9px] font-mono tracking-wider">Trending</span>
            </button>

            {/* Saved */}
            <button
              onClick={() => {
                setActiveTab('saved');
                setShowSaved(true);
                setShowSearch(false);
                setShowTrending(false);
                setShowSettings(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'saved' ? 'text-indigo-400' : 'text-neutral-555 hover:text-neutral-300'
              }`}
            >
              <div className="relative">
                <Heart className={`w-5 h-5 ${savedPapers.length > 0 && activeTab === 'saved' ? 'fill-indigo-400' : ''}`} />
                {savedPapers.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-[8px] font-bold text-white rounded-full h-3.5 w-3.5 flex items-center justify-center font-mono">
                    {savedPapers.length}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono tracking-wider">Library</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                setActiveTab('settings');
                setShowSettings(true);
                setShowSearch(false);
                setShowTrending(false);
                setShowSaved(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'settings' ? 'text-indigo-400' : 'text-neutral-555 hover:text-neutral-300'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[9px] font-mono tracking-wider">Config</span>
            </button>
          </nav>

          {/* Drawers / Overlays */}
          <SearchBar
            isOpen={showSearch}
            onClose={() => { setShowSearch(false); setActiveTab('home'); }}
            onSelectPaper={handleSelectPaper}
          />

          <Trending
            isOpen={showTrending}
            onClose={() => { setShowTrending(false); setActiveTab('home'); }}
            onSelectPaper={handleSelectPaper}
          />

          <SavedPapers
            isOpen={showSaved}
            savedList={savedPapers}
            onClose={() => { setShowSaved(false); setActiveTab('home'); }}
            onSelectPaper={handleSelectPaper}
            onRemovePaper={handleRemovePaper}
          />

          <SettingsDrawer
            isOpen={showSettings}
            onClose={() => { setShowSettings(false); setActiveTab('home'); }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
