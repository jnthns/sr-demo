// Simplified Gemini Chat utilities - Client-side only
// All actual API calls are now handled by the chatService

// Utility functions for client-side use
export const validateApiKey = (apiKey) => {
  return !!apiKey;
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

// Legacy compatibility functions (now just pass-through to chatService)
export const initializeChat = async (apiKey, systemPrompt = null) => {
  // This is now handled by the API route, just return success
  return { success: true, sessionId: Date.now().toString() };
};

// Default export for backward compatibility
export default {
  initializeChat,
  validateApiKey,
  handleGeminiError
};