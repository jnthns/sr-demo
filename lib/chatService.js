// Chat Service - Clean API communication layer
export class ChatService {
  constructor() {
    this.baseUrl = '/api/chat';
  }

  // Check if API key is configured
  async checkApiKey() {
    try {
      const response = await fetch('/api/chat/config');
      const config = await response.json();
      return {
        success: true,
        hasApiKey: config.hasApiKey,
        message: config.message
      };
    } catch (error) {
      console.error('Error checking API key:', error);
      return {
        success: false,
        hasApiKey: false,
        error: 'Failed to check API key configuration'
      };
    }
  }

  // Send a message to the chat API
  async sendMessage(message, history = []) {
    try {
      // Prepare history for the API call
      const formattedHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          history: formattedHistory, 
          message: message 
        }),
      });

      // Parse response body first to get error details
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, create error from status
        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`);
          error.status = response.status;
          throw error;
        }
        throw new Error('Invalid response format from server');
      }
      
      if (!response.ok) {
        // If we have an error message from the API, use it
        if (data.error) {
          const error = new Error(data.error);
          error.status = response.status;
          throw error;
        }
        // Otherwise create a generic error with status
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      
      if (data.error) {
        const error = new Error(data.error);
        error.status = response.status;
        throw error;
      }

      return {
        success: true,
        response: data.response,
        tokenCount: data.tokenCount,
        usage: data.usage,
        timestamp: data.timestamp
      };

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Handle specific error types
      let errorMessage = 'An error occurred while processing your request';
      
      // Check for rate limiting (429 status)
      if (error.status === 429 || error.message.includes('429') || 
          error.message.toLowerCase().includes('rate limit') || 
          error.message.toLowerCase().includes('quota')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('API_KEY') || error.message.includes('API key')) {
        errorMessage = 'Invalid or missing API key';
      } else if (error.message.includes('SAFETY')) {
        errorMessage = 'Content blocked by safety filters';
      } else if (error.message.includes('Message too long')) {
        errorMessage = 'Message too long. Please keep it under 1000 characters.';
      } else if (error.message && error.message !== 'HTTP error! status: 429') {
        // Use the error message from the API if available
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        originalError: error.message,
        statusCode: error.status
      };
    }
  }

  // Validate message before sending
  validateMessage(message) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return {
        valid: false,
        error: 'Message is required and must be a non-empty string.'
      };
    }

    if (message.length > 1000) {
      return {
        valid: false,
        error: 'Message too long. Please keep it under 1000 characters.'
      };
    }

    return {
      valid: true,
      error: null
    };
  }
}

// Create a singleton instance
export const chatService = new ChatService();
