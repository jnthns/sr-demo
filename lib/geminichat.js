import { GoogleGenAI } from '@google/genai';

// Configuration
const MODEL_NAME = 'gemini-2.5-flash'; // Using the latest model
const MAX_TOKENS = 8192;
const TEMPERATURE = 0.7;

// Initialize the Gemini AI client
let genAI = null;

// Initialize the AI client
const initializeGemini = (apiKey) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.');
  }
  
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: apiKey });
  }
  
  return { genAI };
};

// Chat session management using the new SDK
class ChatSession {
  constructor(apiKey) {
    this.chat = null;
    this.messageHistory = [];
    this.sessionId = Date.now().toString();
    this.apiKey = apiKey;
  }

  async startNewSession(systemPrompt = null) {
    try {
      const { genAI } = initializeGemini(this.apiKey);
      
      const systemInstruction = systemPrompt || `You are a helpful AI assistant. You should:
    - Be friendly, helpful, and professional
    - Provide accurate and useful information
    - Ask clarifying questions when needed
    - Prioritize conciseness and clarity over verbosity
    - Limit your responses to 200 words or less
    - Use examples and analogies to help explain complex concepts
    - Use markdown formatting to make the responses more readable
    - Use code blocks to format code examples
    - Use tables and lists to format data
    - Use bold and italic formatting to highlight important information
    - Use links to provide additional resources
    - Use emojis to add a little personality to the responses
    - Be respectful and inclusive in all interactions`;

      // Create a new chat session using the new SDK
      this.chat = genAI.chats.create({
        model: MODEL_NAME,
        config: {
          generationConfig: {
            maxOutputTokens: MAX_TOKENS,
            temperature: TEMPERATURE,
            topP: 0.8,
            topK: 40,
          },
          systemInstruction: systemInstruction
        }
      });

      this.messageHistory = [];
      return true;
    } catch (error) {
      console.error('Error starting chat session:', error);
      throw error;
    }
  }

  async sendMessage(message) {
    if (!this.chat) {
      await this.startNewSession();
    }

    try {
      // Send message using the new SDK with proper content structure
      const response = await this.chat.sendMessage({
        contents: [{ role: 'user', parts: [{ text: message }] }]
      });

      const text = response.text;

      // Store the conversation
      this.messageHistory.push({
        user: message,
        assistant: text,
        timestamp: new Date(),
        sessionId: this.sessionId
      });

      return {
        text: text,
        success: true,
        usage: {
          promptTokens: response.usage?.promptTokenCount || 0,
          candidatesTokens: response.usage?.candidatesTokenCount || 0,
          totalTokens: response.usage?.totalTokenCount || 0
        }
      };
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      
      // Handle specific Gemini API errors
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API key configuration.');
      } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else if (error.message.includes('SAFETY') || error.message.includes('safety')) {
        throw new Error('Message blocked by safety filters. Please rephrase your request.');
      } else if (error.message.includes('CONTENT_FILTER') || error.message.includes('content')) {
        throw new Error('Content filtered. Please try a different approach.');
      } else {
        throw new Error(`Gemini API error: ${error.message}`);
      }
    }
  }

  getHistory() {
    return this.messageHistory;
  }

  clearHistory() {
    this.messageHistory = [];
    this.chat = null;
  }
}

// Simple implementation matching Google's documentation
export const sendMessageSimple = async (message, apiKey) => {
  try {
    const { genAI } = initializeGemini(apiKey);
    
    // Simple approach matching Google's documentation
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: message, // Simple string as shown in Google's docs
    });

    return {
      text: response.text,
      success: true,
      usage: {
        promptTokens: response.usage?.promptTokenCount || 0,
        candidatesTokens: response.usage?.candidatesTokenCount || 0,
        totalTokens: response.usage?.totalTokenCount || 0
      }
    };
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

// Alternative implementation using direct model calls (for more advanced use cases)
export const sendMessageDirect = async (message, apiKey, systemPrompt = null) => {
  try {
    const { genAI } = initializeGemini(apiKey);
    
    const systemInstruction = systemPrompt || `You are a helpful AI assistant. You should:
- Be friendly, helpful, and professional
- Provide accurate and useful information
- Ask clarifying questions when needed
- Keep responses concise but comprehensive
- Be respectful and inclusive in all interactions`;

    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        generationConfig: {
          maxOutputTokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          topP: 0.8,
          topK: 40,
        },
        systemInstruction: systemInstruction
      }
    });

    return {
      text: response.text,
      success: true,
      usage: {
        promptTokens: response.usage?.promptTokenCount || 0,
        candidatesTokens: response.usage?.candidatesTokenCount || 0,
        totalTokens: response.usage?.totalTokenCount || 0
      }
    };
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    
    // Handle specific Gemini API errors
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key configuration.');
    } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message.includes('SAFETY') || error.message.includes('safety')) {
      throw new Error('Message blocked by safety filters. Please rephrase your request.');
    } else if (error.message.includes('CONTENT_FILTER') || error.message.includes('content')) {
      throw new Error('Content filtered. Please try a different approach.');
    } else {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
};

// Global chat session instance
let globalChatSession = null;

// Main API functions
export const initializeChat = async (apiKey, systemPrompt = null) => {
  try {
    globalChatSession = new ChatSession(apiKey);
    await globalChatSession.startNewSession(systemPrompt);
    return { success: true, sessionId: globalChatSession.sessionId };
  } catch (error) {
    console.error('Failed to initialize chat:', error);
    return { success: false, error: error.message };
  }
};

export const sendMessage = async (message, apiKey) => {
  try {
    if (!globalChatSession) {
      await initializeChat(apiKey);
    }

    const result = await globalChatSession.sendMessage(message);
    return result;
  } catch (error) {
    console.error('Failed to send message:', error);
    return {
      text: `Error: ${error.message}`,
      success: false,
      error: error.message
    };
  }
};

export const getChatHistory = () => {
  return globalChatSession ? globalChatSession.getHistory() : [];
};

export const clearChatHistory = () => {
  if (globalChatSession) {
    globalChatSession.clearHistory();
  }
};

export const getSessionInfo = () => {
  return {
    sessionId: globalChatSession?.sessionId || null,
    messageCount: globalChatSession?.messageHistory?.length || 0,
    isInitialized: !!globalChatSession
  };
};

// Utility functions
export const validateApiKey = (apiKey) => {
  return !!apiKey;
};

export const getModelInfo = () => {
  return {
    modelName: MODEL_NAME,
    maxTokens: MAX_TOKENS,
    temperature: TEMPERATURE
  };
};

// Error handling utilities
export const handleGeminiError = (error) => {
  const errorMap = {
    'API_KEY_INVALID': 'Invalid API key. Please check your configuration.',
    'QUOTA_EXCEEDED': 'API quota exceeded. Please try again later.',
    'SAFETY': 'Message blocked by safety filters.',
    'CONTENT_FILTER': 'Content filtered. Please try a different approach.',
    'NETWORK': 'Network error. Please check your connection.',
    'TIMEOUT': 'Request timed out. Please try again.'
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key)) {
      return message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

// Export the ChatSession class for advanced usage
export { ChatSession };

// Default export
export default {
  initializeChat,
  sendMessage,
  sendMessageSimple,
  sendMessageDirect,
  getChatHistory,
  clearChatHistory,
  getSessionInfo,
  validateApiKey,
  getModelInfo,
  handleGeminiError
};