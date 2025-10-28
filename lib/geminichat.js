import { GoogleGenAI } from "@google/genai";

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash'; // Using the latest model
const MAX_TOKENS = 8192;
const TEMPERATURE = 0.7;

// Initialize the Gemini AI client
let genAI = null;
let model = null;

// Initialize the AI client
const initializeGemini = () => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.');
  }
  
  if (!genAI) {
    genAI = new GoogleGenAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        topP: 0.8,
        topK: 40,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    });
  }
  
  return { genAI, model };
};

// Chat session management
class ChatSession {
  constructor() {
    this.chat = null;
    this.messageHistory = [];
    this.sessionId = Date.now().toString();
  }

  async startNewSession(systemPrompt = null) {
    try {
      const { model } = initializeGemini();
      
      const systemInstruction = systemPrompt || `You are a helpful AI assistant. You should:
        - Be friendly, helpful, and professional
        - Provide accurate and useful information
        - Ask clarifying questions when needed
        - Keep responses concise but comprehensive
        - Be respectful and inclusive in all interactions`;

      this.chat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: MAX_TOKENS,
          temperature: TEMPERATURE,
        },
        systemInstruction: systemInstruction
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
      const result = await this.chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

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
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      
      // Handle specific Gemini API errors
      if (error.message.includes('API_KEY_INVALID')) {
        throw new Error('Invalid API key. Please check your Gemini API key configuration.');
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else if (error.message.includes('SAFETY')) {
        throw new Error('Message blocked by safety filters. Please rephrase your request.');
      } else if (error.message.includes('CONTENT_FILTER')) {
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

// Global chat session instance
let globalChatSession = null;

// Main API functions
export const initializeChat = async (systemPrompt = null) => {
  try {
    globalChatSession = new ChatSession();
    await globalChatSession.startNewSession(systemPrompt);
    return { success: true, sessionId: globalChatSession.sessionId };
  } catch (error) {
    console.error('Failed to initialize chat:', error);
    return { success: false, error: error.message };
  }
};

export const sendMessage = async (message) => {
  try {
    if (!globalChatSession) {
      await initializeChat();
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
export const validateApiKey = () => {
  return !!GEMINI_API_KEY;
};

export const getModelInfo = () => {
  return {
    modelName: MODEL_NAME,
    maxTokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    hasApiKey: validateApiKey()
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
  getChatHistory,
  clearChatHistory,
  getSessionInfo,
  validateApiKey,
  getModelInfo,
  handleGeminiError
};
