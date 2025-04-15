// api/summary.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { conversation } = req.body;
      
      // System prompt for summarization
      const systemPrompt = {
        role: 'system',
        content: 'You are a helpful assistant that summarizes dental consultations. Create a concise 3-sentence summary of the conversation, focusing on the main dental issues, advice given, and any follow-up needed. Be professional but friendly.'
      };
      
      const userPrompt = {
        role: 'user',
        content: `Please summarize this dental consultation in exactly 3 sentences:\n\n${conversation}`
      };
      
      // Call OpenAI API using server's API key
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [systemPrompt, userPrompt]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || `OpenAI API error (${response.status})`;
        console.error('OpenAI API error:', errorData.error);
        return res.status(response.status).json({ error: errorMessage });
      }
      
      const data = await response.json();
      
      return res.status(200).json({ 
        summary: data.choices[0].message.content 
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      return res.status(500).json({ error: error.message });
    }
  }