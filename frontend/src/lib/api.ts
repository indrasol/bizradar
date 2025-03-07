interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getAIResponse(messages: ChatMessage[], documentContent?: string) {
  try {
    const response = await fetch('http://localhost:5000/ask-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        documentContent,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw error;
  }
} 