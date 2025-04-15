// api/chat.js
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      // Get the messages from the request body
      const { messages } = req.body;
      
      // Add your system message
      const completeMessages = [
        {
          role: 'system',
          content: 'You are a professional dental assistant. Be concise, friendly, and clear when replying to patients.'
        },
        ...messages
      ];
  
      // Call OpenAI API using server environment variable
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: completeMessages
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error?.message || `OpenAI API error (${response.status})`;
        console.error('OpenAI API error:', data.error);
        return res.status(response.status).json({ error: errorMessage });
      }
      
      // Return the AI response to the client
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return res.status(500).json({ error: 'Failed to process request' });
    }
  }