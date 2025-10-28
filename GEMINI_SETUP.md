# Google Gemini API Implementation

This implementation provides a comprehensive Google Gemini API integration for your Next.js application.

## 🚀 Features

- **Advanced Chat Sessions**: Persistent conversation history with context
- **Error Handling**: Comprehensive error management for all API scenarios
- **Safety Settings**: Built-in content filtering and safety measures
- **Token Usage Tracking**: Monitor API usage and costs
- **Flexible Configuration**: Easy to customize model parameters
- **Session Management**: Maintain conversation context across requests

## 📋 Setup Instructions

### 1. Get Your API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Configure Environment Variables
Create a `.env.local` file in your project root:

```bash
# Required: Your Gemini API key
GEMINI_API_KEY=your_actual_api_key_here

# Optional: For client-side usage (less secure)
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Test the Implementation
```bash
# Start your development server
npm run dev

# Test the API health endpoint
curl http://localhost:3000/api/chat
```

## 🔧 API Usage

### Basic Usage
```javascript
import { sendMessage, initializeChat } from '../lib/geminichat';

// Initialize a chat session
await initializeChat();

// Send a message
const result = await sendMessage("Hello, how are you?");
console.log(result.text);
```

### Advanced Usage
```javascript
import { ChatSession } from '../lib/geminichat';

// Create a custom chat session
const chat = new ChatSession();
await chat.startNewSession("You are a helpful coding assistant.");

// Send messages with context
const response = await chat.sendMessage("Explain React hooks");
console.log(response.text);
console.log(response.usage); // Token usage information
```

## 📡 API Endpoints

### POST `/api/chat`
Send a message to the Gemini AI.

**Request:**
```json
{
  "message": "Your question here"
}
```

**Response:**
```json
{
  "response": "AI response text",
  "usage": {
    "promptTokens": 10,
    "candidatesTokens": 50,
    "totalTokens": 60
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET `/api/chat`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "hasApiKey": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "message": "Chat API is ready"
}
```

## ⚙️ Configuration Options

### Model Settings
```javascript
// In lib/geminichat.js
const MODEL_NAME = 'gemini-1.5-flash'; // Latest model
const MAX_TOKENS = 8192;               // Maximum response length
const TEMPERATURE = 0.7;               // Creativity level (0-1)
```

### Safety Settings
The implementation includes comprehensive safety filters:
- Harassment detection
- Hate speech filtering
- Explicit content blocking
- Dangerous content prevention

## 🛠️ Available Functions

### Core Functions
- `initializeChat(systemPrompt)` - Start a new chat session
- `sendMessage(message)` - Send a message and get response
- `getChatHistory()` - Retrieve conversation history
- `clearChatHistory()` - Clear the current session
- `getSessionInfo()` - Get session metadata

### Utility Functions
- `validateApiKey()` - Check if API key is configured
- `getModelInfo()` - Get current model configuration
- `handleGeminiError(error)` - Process and format errors

## 🔍 Error Handling

The implementation handles various error scenarios:

- **API Key Issues**: Invalid or missing API keys
- **Quota Exceeded**: Rate limiting and usage limits
- **Safety Filters**: Content blocked by safety settings
- **Network Issues**: Connection problems and timeouts
- **Input Validation**: Invalid or oversized messages

## 📊 Analytics Integration

The implementation works seamlessly with your existing analytics:

```javascript
// Track successful responses
logEvent('Chatbot Response Received', {
  response_length: result.text.length,
  usage: result.usage,
  timestamp: new Date()
});

// Track errors
logEvent('Chatbot Error', {
  error_type: error.name,
  error_message: error.message
});
```

## 🔒 Security Considerations

- API keys are server-side only (not exposed to client)
- Input validation prevents injection attacks
- Content filtering blocks inappropriate requests
- Rate limiting prevents abuse

## 🚀 Next Steps

1. **Set up your API key** in `.env.local`
2. **Test the chatbot** in Page 2 of your application
3. **Monitor usage** through the analytics dashboard
4. **Customize the system prompt** for your specific use case
5. **Add more features** like file uploads or image analysis

## 📚 Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 🐛 Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Ensure `GEMINI_API_KEY` is set in `.env.local`
   - Restart your development server

2. **"Quota exceeded"**
   - Check your Google AI Studio usage limits
   - Wait for quota reset or upgrade your plan

3. **"Content filtered"**
   - Rephrase your message to avoid triggering safety filters
   - Check the safety settings in the configuration

4. **Network errors**
   - Verify your internet connection
   - Check if Google AI services are accessible in your region
