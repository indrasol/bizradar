// lib/api.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Enhanced AI response function with better context handling
 */
export async function getAIResponse(
  messages: { role: 'user' | 'assistant' | 'system', content: string }[],
  documentContext?: string
) {
  try {
    // Determine if this is a modification request
    const lastUserMessage = messages.findLast(m => m.role === 'user')?.content || '';
    const isModificationRequest = detectDocumentModificationRequest(lastUserMessage);
    
    // Create appropriate system prompt based on context and user request
    let systemPrompt = '';
    
    if (isModificationRequest && documentContext) {
      systemPrompt = `You are an AI assistant helping to modify RFP (Request for Proposal) documents.
      
      Here is the current document content for context:
      
      ${documentContext}
      
      When I ask you to modify, rewrite, or enhance the document, please provide complete, ready-to-use content that I can directly copy into the document. Format your response as proper HTML if needed to preserve formatting.
      
      YOUR RESPONSE WILL BE DIRECTLY INSERTED INTO THE DOCUMENT, so make it complete and properly formatted.`;
    } else {
      systemPrompt = `You are an AI assistant helping with RFP (Request for Proposal) related queries. 
      ${documentContext ? 'Here is the current RFP document or response content for context:\n\n' + documentContext : ''}
      
      Please provide clear, concise, and professional responses focused on helping users understand and work with RFP documents. If you are making suggestions about content modifications, be specific but do not provide entire document rewrites unless explicitly asked.`;
    }

    // Make the API call
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: isModificationRequest ? 0.3 : 0.7, // Lower temperature for modifications
      max_tokens: isModificationRequest ? 1500 : 500  // More tokens for modifications
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to get AI response');
  }
}

/**
 * Detects if a user message is requesting document modifications
 */
function detectDocumentModificationRequest(userMessage: string): boolean {
  const modificationKeywords = [
    'update', 'change', 'modify', 'edit', 'revise', 'rewrite', 
    'add', 'insert', 'include', 'append', 'create', 'generate',
    'remove', 'delete', 'replace', 'fix', 'correct'
  ];
  
  const lowercaseMessage = userMessage.toLowerCase();
  
  // Check for modification keywords
  const hasModificationKeyword = modificationKeywords.some(keyword => 
    lowercaseMessage.includes(keyword)
  );
  
  // Check for document references
  const hasDocumentReference = 
    lowercaseMessage.includes('document') || 
    lowercaseMessage.includes('rfp') || 
    lowercaseMessage.includes('proposal') ||
    lowercaseMessage.includes('response') ||
    lowercaseMessage.includes('content');
  
  return hasModificationKeyword && hasDocumentReference;
}

/**
 * Process the entire document with AI
 */
export async function processDocumentWithAI(
  content: string,
  instruction: string = "Please review this RFP document and improve the formatting and structure while keeping all content."
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant specializing in RFP document processing and improvement. 
          You will be provided with an RFP document that needs to be processed according to specific instructions.
          Return the full, improved document content in proper HTML format if applicable.`
        },
        {
          role: 'user',
          content: `${instruction}:\n\n${content}`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    const processedContent = response.choices[0].message.content;
    
    // Handle markdown code blocks if present
    let cleanedContent = processedContent || '';
    if (cleanedContent.startsWith("```html")) {
      cleanedContent = cleanedContent.replace("```html", "", 1);
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
    }

    return cleanedContent.trim();
  } catch (error) {
    console.error('Error processing document with AI:', error);
    throw new Error('Failed to process document');
  }
}