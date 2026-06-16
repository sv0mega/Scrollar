import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Standard fetch exists in modern Node, but let's write simple fetch. Node 18+ has global fetch, so we can use global fetch directly.

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.post('/api/summarize', async (req, res) => {
  try {
    const { title, abstract } = req.body;

    if (!title || !abstract) {
      return res.status(400).json({ error: 'Title and abstract are required.' });
    }

    // Get key from header OR environment
    const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(401).json({
        error: 'Anthropic API Key missing. Please provide it in the settings panel or set ANTHROPIC_API_KEY in the server environment.'
      });
    }

    const systemPrompt = `You are an elite science communicator. Given a research paper title and abstract, summarize it into a JSON object. Do not output any Markdown wrapping, code blocks, or conversational text. Output ONLY a valid JSON object matching this schema:
{
  "tldr": "A 1-2 sentence high-level summary of the paper's core thesis and impact.",
  "findings": [
    "Key discovery or methodology finding 1 (clear, simple, high-impact)",
    "Key discovery or methodology finding 2",
    "Key discovery or methodology finding 3"
  ],
  "domain": "One word classification from: [Computer Science, Biology, Physics, Medicine, Economics, Astronomy, Neuroscience, Environmental Science]",
  "complexity": 2
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Title: ${title}\n\nAbstract: ${abstract}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', errorText);
      return res.status(response.status).json({ error: `Anthropic API error: ${errorText}` });
    }

    const data = await response.json();
    let textContent = data.content?.[0]?.text || '';
    
    // Clean up Markdown code blocks if present
    textContent = textContent.trim();
    if (textContent.startsWith('```json')) {
      textContent = textContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (textContent.startsWith('```')) {
      textContent = textContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    textContent = textContent.trim();

    try {
      const parsedData = JSON.parse(textContent);
      return res.json(parsedData);
    } catch (parseError) {
      console.error('Failed to parse Claude JSON response:', textContent);
      return res.status(500).json({
        error: 'Failed to parse AI response as JSON',
        rawResponse: textContent
      });
    }

  } catch (error) {
    console.error('Server error during summarization:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasKey: !!process.env.ANTHROPIC_API_KEY });
});

app.listen(PORT, () => {
  console.log(`Research Reel Proxy Server running on http://localhost:${PORT}`);
});
