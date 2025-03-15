interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Use a constant for the base API URL
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment ? 'http://localhost:5000' : 'https://bizradar-backend.onrender.com';

export async function getAIResponse(messages: ChatMessage[], documentContent?: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/ask-ai`, {
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

// Example API function
export const fetchOpportunities = async (query, page, pageSize) => {
    const response = await fetch(`${API_BASE_URL}/search-opportunities`, {
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