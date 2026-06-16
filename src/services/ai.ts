import { estimateDomain } from './api';

export interface AISummary {
  tldr: string;
  findings: string[];
  domain: string;
  complexity: number;
}

// Intelligent heuristic client-side summarizer
export function generateLocalFallbackSummary(title: string, abstract: string): AISummary {
  const estimatedDomain = estimateDomain(title, abstract);
  
  // Clean abstract of standard XML/HTML and reference brackets
  let cleanAbstract = abstract
    .replace(/<[^>]*>/g, '')
    .replace(/\[\d+\]/g, '') // Remove [1], [2]
    .replace(/\(\w+ et al\., \d{4}\)/g, '') // Remove (Author et al., 2020)
    .trim();

  // Split abstract into sentences
  const sentences = cleanAbstract
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  // Extract TL;DR: Usually the first 1-2 sentences of the abstract
  const tldrSentences = sentences.slice(0, Math.min(2, sentences.length));
  const tldr = tldrSentences.join(' ') || `This study investigates the key properties and theoretical implications of ${title.toLowerCase().replace(/\.$/, '')}.`;

  // Find sentences that look like findings
  const findingsCandidates = sentences.filter((s, idx) => {
    // Skip the first sentence (often background)
    if (idx === 0) return false;
    const lower = s.toLowerCase();
    return (
      lower.includes('show') ||
      lower.includes('find') ||
      lower.includes('demonstrate') ||
      lower.includes('result') ||
      lower.includes('observe') ||
      lower.includes('propose') ||
      lower.includes('introduce') ||
      lower.includes('we develop') ||
      lower.includes('achieve') ||
      lower.includes('significant') ||
      lower.includes('conclude')
    );
  });

  const findings: string[] = [];
  
  // Try to pick three distinct findings
  if (findingsCandidates.length >= 3) {
    findings.push(findingsCandidates[0]);
    findings.push(findingsCandidates[1]);
    findings.push(findingsCandidates[2]);
  } else {
    findingsCandidates.forEach(c => findings.push(c));
    
    // Add other sentences from middle/end
    for (let i = 2; i < sentences.length && findings.length < 3; i++) {
      if (!findings.includes(sentences[i])) {
        findings.push(sentences[i]);
      }
    }
    
    // Default fallback findings if abstract is too short
    while (findings.length < 3) {
      if (findings.length === 0) {
        findings.push(`Proposes novel approaches to address complex challenges in ${estimatedDomain}.`);
      } else if (findings.length === 1) {
        findings.push("Demonstrates substantial improvements over baseline models and standard methodologies.");
      } else {
        findings.push("Outlines critical paths and future frameworks for ongoing research in this discipline.");
      }
    }
  }

  // Format findings as bullet summaries (keep them under 120 chars if possible)
  const formattedFindings = findings.map(f => {
    let text = f;
    // Strip leading transitions if any
    text = text.replace(/^(Furthermore,|Moreover,|However,|Therefore,|In addition,)\s*/i, '');
    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);
    return text;
  });

  // Calculate Complexity Score (1-5) based on technical words
  const technicalWords = [
    'quantum', 'differential', 'stochastic', 'manifolds', 'polynomial', 'asymptotic',
    'spectroscopy', 'pharmacokinetics', 'epigenetic', 'crispr', 'hegemonic', 'methodology',
    'isotopic', 'electromagnetic', 'eigenvalue', 'tensor', 'cryptographic', 'neural network',
    'thermodynamics', 'synthesis', 'covariance', 'microbiome', 'splicing', 'pathogenesis'
  ];
  let hits = 0;
  technicalWords.forEach(w => {
    if (abstract.toLowerCase().includes(w)) hits++;
  });
  
  const complexity = Math.min(5, Math.max(1, Math.floor(hits / 1.5) + 2));

  return {
    tldr,
    findings: formattedFindings.slice(0, 3),
    domain: estimatedDomain,
    complexity
  };
}

// Fetch summary from Express proxy (with fallback to client-side heuristics)
export async function getPaperSummary(
  title: string,
  abstract: string,
  userApiKey?: string,
  proxyUrl = 'http://localhost:3001'
): Promise<AISummary> {
  // If abstract is empty/missing
  if (!abstract || abstract.trim().length < 10) {
    return {
      tldr: 'Abstract not available. Please open the full text or PDF link to review the details of this paper.',
      findings: [
        'No abstract text was provided in the database records.',
        'We suggest retrieving the paper via the PDF button or searching by DOI.',
        'Citation velocity and other metadata remain available.'
      ],
      domain: estimateDomain(title, ''),
      complexity: 3
    };
  }

  // Check if user specified "Local Only" or similar
  const useLocalOnly = localStorage.getItem('rr_use_local_only') === 'true';
  if (useLocalOnly) {
    return generateLocalFallbackSummary(title, abstract);
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (userApiKey) {
      headers['x-api-key'] = userApiKey;
    }

    const response = await fetch(`${proxyUrl}/api/summarize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, abstract })
    });

    if (!response.ok) {
      throw new Error(`Proxy returned status ${response.status}`);
    }

    const data = await response.json();
    return {
      tldr: data.tldr,
      findings: data.findings || [],
      domain: data.domain || estimateDomain(title, abstract),
      complexity: data.complexity || 3
    };

  } catch (error) {
    console.warn('AI Summarizer Proxy failed or key is missing. Using intelligent client-side fallback summarizer.', error);
    // Silent fallback to client-side heuristic engine
    return generateLocalFallbackSummary(title, abstract);
  }
}
