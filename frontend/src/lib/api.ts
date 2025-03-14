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

// Import the environment variable
import.meta.env.VITE_BASE_API_URL;

// Example API function
export const fetchOpportunities = async (query, page, pageSize) => {
    const response = await fetch(`${import.meta.env.VITE_BASE_API_URL}/search-opportunities`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
            page,
            page_size: pageSize,
        }),
    });
    return response.json();
}; 