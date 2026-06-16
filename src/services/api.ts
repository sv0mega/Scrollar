export interface Paper {
  id: string;
  title: string;
  authors: string[];
  journal?: string;
  year: number;
  abstract: string;
  citationCount: number;
  citationVelocity?: number;
  openAccessPdf?: string;
  doi?: string;
  domain?: string;
  tldr?: string;
  findings?: string[];
  complexity?: number;
  isLoadingAI?: boolean;
}


// Reconstruct abstract from OpenAlex's inverted index
export function reconstructAbstract(invertedIndex: Record<string, number[]> | null | undefined): string {
  if (!invertedIndex) return '';
  try {
    const words: string[] = [];
    Object.entries(invertedIndex).forEach(([word, positions]) => {
      positions.forEach((pos) => {
        words[pos] = word;
      });
    });
    return words.filter((w) => w !== undefined).join(' ');
  } catch (e) {
    console.error('Failed to reconstruct abstract:', e);
    return '';
  }
}

// Estimate research domain based on titles/abstracts/subjects
export function estimateDomain(title: string, abstract: string, conceptKeywords: string[] = []): string {
  const text = `${title} ${abstract} ${conceptKeywords.join(' ')}`.toLowerCase();
  
  if (text.match(/neural network|deep learning|algorithm|software|computing|database|cryptography|machine learning|artificial intelligence|web app|compiler|security/)) {
    return 'Computer Science';
  }
  if (text.match(/cancer|clinical|patient|disease|drug|therapy|vaccine|cardiac|infection|symptom|hospital|surgical/)) {
    return 'Medicine';
  }
  if (text.match(/cell|protein|gene|dna|rna|evolution|genetics|enzyme|organism|microbe|ecology|plant|neuron/)) {
    return 'Biology';
  }
  if (text.match(/quantum|physics|relativity|gravity|particle|thermodynamics|laser|superconductor|optics|hadron/)) {
    return 'Physics';
  }
  if (text.match(/galaxy|star|telescope|cosmos|orbit|planet|hubble|astronomy|astrophysics|nebula/)) {
    return 'Astronomy';
  }
  if (text.match(/brain|cognitive|cortex|synapse|neurological|memory|perception|neuroscience|psychology/)) {
    return 'Neuroscience';
  }
  if (text.match(/climate|carbon|warming|ecology|conservation|ocean|glacier|deforestation|environment|meteorology/)) {
    return 'Environmental Science';
  }
  if (text.match(/inflation|market|gdp|finance|economic|game theory|microeconomics|macroeconomics|policy|tariff/)) {
    return 'Economics';
  }
  
  return 'Computer Science'; // Fallback default
}

// Fetch papers using Semantic Scholar Search
export async function searchPapers(query: string, limit = 20): Promise<Paper[]> {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,abstract,citationCount,year,venue,externalIds,openAccessPdf`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Semantic Scholar Search failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.data) return [];

    return data.data
      .filter((item: any) => item.abstract && item.abstract.trim().length > 30) // Only papers with abstracts
      .map((item: any) => {
        const authors = (item.authors || []).map((a: any) => a.name);
        const doi = item.externalIds?.DOI || '';
        const estimated = estimateDomain(item.title, item.abstract);
        
        return {
          id: `ss-${item.paperId}`,
          title: item.title,
          authors: authors.length > 0 ? authors : ['Unknown Author'],
          journal: item.venue || 'Academic Journal',
          year: item.year || new Date().getFullYear(),
          abstract: item.abstract,
          citationCount: item.citationCount || 0,
          citationVelocity: Math.floor((item.citationCount || 0) * 0.1), // Approximation
          openAccessPdf: item.openAccessPdf?.url || undefined,
          doi: doi || undefined,
          domain: estimated
        };
      });
  } catch (error) {
    console.error('Semantic Scholar Search error:', error);
    return [];
  }
}

// Fetch Trending papers from OpenAlex
export async function fetchTrendingPapers(domainFilter?: string, limit = 25): Promise<Paper[]> {
  try {
    // Determine domain tag query filters for OpenAlex concepts
    let filterString = 'has_abstract:true,publication_year:2024|2025|2026';
    if (domainFilter) {
      const conceptIdMap: Record<string, string> = {
        'Computer Science': 'c41008148',
        'Biology': 'c86803240',
        'Medicine': 'c71924100',
        'Physics': 'c121332964',
        'Economics': 'c162324750',
        'Astronomy': 'c121332964', // Grouped under physics concepts or custom
        'Neuroscience': 'c119599419',
        'Environmental Science': 'c39572599'
      };
      const conceptId = conceptIdMap[domainFilter];
      if (conceptId) {
        filterString += `,concepts.id:${conceptId}`;
      }
    }

    const url = `https://api.openalex.org/works?filter=${encodeURIComponent(filterString)}&sort=cited_by_count:desc&per_page=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenAlex Trending fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.results) return [];

    return data.results.map((item: any) => {
      const title = item.title || item.display_name || 'Untitled Paper';
      const abstract = reconstructAbstract(item.abstract_inverted_index);
      const authors = (item.authorships || []).map((auth: any) => auth.author?.display_name).filter(Boolean);
      const journal = item.primary_location?.source?.display_name || 'Scientific Journal';
      const year = item.publication_year || new Date().getFullYear();
      const openAccessPdf = item.primary_location?.pdf_url || item.open_access?.oa_url || undefined;
      const doi = item.doi ? item.doi.replace('https://doi.org/', '') : undefined;
      const concepts = (item.concepts || []).map((c: any) => c.display_name);
      const domain = domainFilter || estimateDomain(title, abstract, concepts);

      // Estimate citation velocity: how fast it's citations are growing
      // OpenAlex has citations_by_year, we can sum the last 2 years or use a standard formula
      let citationVelocity = 0;
      if (item.counts_by_year && item.counts_by_year.length > 0) {
        citationVelocity = item.counts_by_year
          .slice(0, 2)
          .reduce((sum: number, entry: any) => sum + (entry.cited_by_count || 0), 0);
      } else {
        citationVelocity = Math.floor((item.cited_by_count || 0) * 0.15);
      }

      return {
        id: `oa-${item.id.replace('https://openalex.org/', '')}`,
        title,
        authors: authors.length > 0 ? authors : ['Unknown Author'],
        journal,
        year,
        abstract: abstract || 'Abstract not available.',
        citationCount: item.cited_by_count || 0,
        citationVelocity,
        openAccessPdf,
        doi,
        domain
      };
    }).filter((p: Paper) => p.abstract && p.abstract.length > 50); // Ensure meaningful abstracts
  } catch (error) {
    console.error('OpenAlex Trending error:', error);
    return [];
  }
}

// Fetch paper by DOI via CrossRef (optional lookup helper)
export async function fetchPaperByDOI(doi: string): Promise<Paper | null> {
  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const work = data.message;
    if (!work) return null;

    const title = work.title?.[0] || 'Untitled';
    const authors = (work.author || []).map((a: any) => `${a.given || ''} ${a.family || ''}`.trim());
    const journal = work['container-title']?.[0] || 'Scientific Journal';
    const year = work.issued?.['date-parts']?.[0]?.[0] || new Date().getFullYear();
    const abstract = work.abstract ? work.abstract.replace(/<[^>]*>/g, '') : ''; // Clean XML tags

    return {
      id: `cr-${work.DOI}`,
      title,
      authors: authors.length > 0 ? authors : ['Unknown Author'],
      journal,
      year,
      abstract,
      citationCount: work['is-referenced-by-count'] || 0,
      citationVelocity: Math.floor((work['is-referenced-by-count'] || 0) * 0.1),
      doi: work.DOI,
      domain: estimateDomain(title, abstract)
    };
  } catch (error) {
    console.error('CrossRef fetch error:', error);
    return null;
  }
}
