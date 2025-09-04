import { API_ENDPOINTS } from "@/config/apiEndpoints";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getAIResponse(messages: ChatMessage[], documentContent?: string) {
  try {
    const response = await fetch(API_ENDPOINTS.ASK_AI, {
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
    const response = await fetch(API_ENDPOINTS.SEARCH_OPPORTUNITIES, {
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