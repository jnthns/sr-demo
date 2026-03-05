'use client'

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { logEvent } from "../../lib/amplitude"
import { initializeChat, clearChatHistory, handleGeminiError } from "../../lib/geminichat"
import { chatService } from "../../lib/chatService"
import PageHeading from '../components/PageHeading';

const MarkdownRenderer = dynamic(() => import("../components/MarkdownRenderer"), {
  ssr: false,
  loading: () => <p className="text-sm text-zen-500">Loading message...</p>
});

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const chatContainerRef = useRef(null);
  const TOKEN_LIMIT = 32000; // Free tier limit for gemini-pro

  // Initialize with welcome message and load saved messages
  useEffect(() => {
    const initializeChatbot = async () => {
      // Check if API key is available using chatService
      const apiCheck = await chatService.checkApiKey();
      
      if (!apiCheck.success || !apiCheck.hasApiKey) {
        setError(apiCheck.error || 'API key not configured');
        setMessages([{
          text: "Hello! I'm your AI assistant, but I need an API key to be configured to help you. Please set up your Gemini API key in the environment variables.",
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        }]);
        return;
      }

      // Load saved messages
      const savedMessages = localStorage.getItem('chatbot-messages');
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages).map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Error loading saved messages:', error);
          setMessages([{
            text: "Hello! I'm your AI assistant. How can I help you today?",
            sender: 'bot',
            timestamp: new Date()
          }]);
        }
      } else {
        setMessages([{
          text: `# Hello! 👋

I'm your **AI assistant** powered by Google Gemini. How can I help?`,
          sender: 'bot',
          timestamp: new Date()
        }]);
      }

      // Initialize the chat session (now just a simple success)
      try {
        await initializeChat('server-side');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setError('Failed to initialize chat session');
      }
    };

    initializeChatbot();
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatbot-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Check if chat content overflows and expand if needed
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 1) {
      // Use a small delay to ensure DOM has updated
      const checkOverflow = setTimeout(() => {
        const container = chatContainerRef.current;
        if (container) {
          const hasOverflow = container.scrollHeight > container.clientHeight;
          
          // Only expand on the first overflow (when first bot response comes in)
          if (hasOverflow && !chatExpanded) {
            setChatExpanded(true);
            // Scroll to bottom after expansion
            setTimeout(() => {
              if (container) {
                container.scrollTop = container.scrollHeight;
              }
            }, 350); // Wait for transition to complete
          }
        }
      }, 100);

      return () => clearTimeout(checkOverflow);
    }
  }, [messages, chatExpanded]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const container = chatContainerRef.current;
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    }
  }, [messages]);

  const handleSend = async () => {
    const messageText = input.trim();
    // Prevent sending if already loading, no message, or limit reached
    if (!messageText || limitReached || isLoading) return;

    // Validate message using chatService
    const validation = chatService.validateMessage(messageText);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const userMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    logEvent('Chatbot Message Sent', { 
      message: messageText,
      message_length: messageText.length,
      timestamp: userMessage.timestamp
    });

    try {
      // Filter out welcome/system messages and error messages from history
      // Only include actual conversation messages (user and bot responses)
      const conversationHistory = messages.filter(msg => 
        msg.sender !== 'bot' || (!msg.text.includes('Hello!') && !msg.isError)
      );
      
      // Use chatService to send message with filtered history
      const result = await chatService.sendMessage(messageText, conversationHistory);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const botMessage = {
        text: result.response || 'I received your message but couldn\'t generate a response.',
        sender: 'bot',
        timestamp: new Date(),
        usage: result.usage
      };

      setMessages([...newMessages, botMessage]);
      
      // Update token count
      if (result.tokenCount) {
        const newTotalTokens = tokenCount + result.tokenCount;
        setTokenCount(newTotalTokens);
        
        if (newTotalTokens >= TOKEN_LIMIT) {
          setLimitReached(true);
        }
      }
      
      logEvent('Chatbot Response Received', {
        response_length: botMessage.text.length,
        usage: result.usage,
        timestamp: botMessage.timestamp
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = handleGeminiError(error);
      setError(errorMessage);

      const errorBotMessage = {
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };

      setMessages([...newMessages, errorBotMessage]);
      
      logEvent('Chatbot Error', {
        error_type: error.name,
        error_message: error.message,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = () => {
    const welcomeMessage = {
      text: `# Hello! 👋

I'm your **AI assistant** powered by Google Gemini. How can I help?`,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    localStorage.setItem('chatbot-messages', JSON.stringify([welcomeMessage]));
    setError(null);
    setChatExpanded(false); // Reset expansion state
    
    logEvent('Chat Cleared', { timestamp: new Date() });
  };

  const handleRestart = () => {
    setMessages([]);
    setTokenCount(0);
    setLimitReached(false);
  };

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        <div className="bg-zen-100 glass-card rounded-2xl border border-zen-200 p-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-3">
              <PageHeading>AI Chatbot</PageHeading>
              <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                isInitialized && !error
                  ? 'bg-matcha-100 text-matcha-300' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isInitialized && !error ? 'bg-matcha-500' : 'bg-amber-500'
                }`}></div>
                <span>
                  {isInitialized && !error ? 'Ready' : 'Initializing...'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-zen-500">
                Tokens: {tokenCount} / {TOKEN_LIMIT}
              </div>
              <button
                onClick={clearChat}
                className="text-sm text-zen-500 hover:text-zen-700 px-2 py-1 rounded hover:bg-zen-200 transition"
              >
                Clear Chat
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-300 text-sm">
                <strong>Note:</strong> {error}
              </p>
            </div>
          )}

          <div 
            ref={chatContainerRef}
            className={`flex flex-col bg-zen-100 p-4 rounded-lg overflow-y-auto mb-4 space-y-2 transition-all duration-300 ease-in-out ${
              chatExpanded ? 'h-[600px]' : 'h-80'
            }`}
          >
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
                <div className={`p-3 rounded-lg ${msg.sender === 'user' 
                  ? 'bg-gradient-to-r from-matcha-500 to-matcha-600 text-white rounded-br-sm' 
                  : msg.isError 
                    ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                    : 'bg-zen-100 text-zen-800 rounded-bl-sm'
                }`}>
                  {msg.sender === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <MarkdownRenderer
                      className="text-sm prose prose-sm max-w-none chat-markdown"
                      content={msg.text}
                      enableCopy
                    />
                  )}
                </div>
                <span className={`text-xs text-zen-500 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center space-x-2 self-start">
                <div className="bg-zen-100 p-3 rounded-lg rounded-bl-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-zen-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-zen-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-zen-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {limitReached ? (
            <div className="text-center">
              <p className="text-red-500 mb-4">You have reached the token limit for this session.</p>
              <button
                onClick={handleRestart}
                className="bg-matcha-500 hover:bg-matcha-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Restart Session
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-grow rounded-lg border border-zen-300 bg-zen-100 p-3 shadow-sm focus:ring-1 focus:ring-matcha-500/50 placeholder:text-zen-400"
                placeholder="Type your message... (Press Enter to send)"
                disabled={isLoading}
                maxLength={1000}
              />
              <button
                onClick={handleSend}
                className="bg-matcha-500 hover:bg-matcha-600 disabled:bg-zen-200 disabled:text-zen-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition flex items-center space-x-2"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
          
          <div className="mt-2 text-xs text-zen-500 text-center">
            {input.length}/1000 characters
          </div>
        </div>
      </div>
    </div>
  );
}
