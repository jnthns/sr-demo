'use client'

import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { logEvent, trackExposure, analytics } from "../lib/amplitude"
import { sendMessage, initializeChat, clearChatHistory, validateApiKey, handleGeminiError } from "../lib/geminichat"
import AnalyticsProvider from "../lib/amplitude"

const Page1 = () => (
  <div className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
    <h2 className="text-2xl font-semibold mb-3">Example Form</h2>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Duis sollicitudin,
      nunc sit amet hendrerit volutpat, nisi nunc varius lacus, a pharetra felis lacus et eros.
    </p>

    {/* Row of Buttons */}
    <div className="flex justify-center gap-4 mb-6">
      <button
        id="track-exposure-btn"
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
      >
        Track Exposure
      </button>
      <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition">
        Button 2
      </button>
      <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition">
        Button 3
      </button>
    </div>

    <div className="mb-4">
      <ul className="list-disc list-inside text-blue-500 dark:text-blue-400">
        <li>
          <a href="https://www.amplitude.com/docs/session-replay" target="_blank" rel="noopener noreferrer">
            Amplitude Session Replay
          </a>
        </li>
        <li>
          <a href="https://www.amplitude.com" target="_blank" rel="noopener noreferrer">
            Example Link
          </a>
        </li>
      </ul>
    </div>

    <form className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
          placeholder="Enter your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
          placeholder="Enter your phone number"
        />
      </div>

      <div>
        <label htmlFor="credit-card" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Credit Card Number
        </label>
        <input
          type="tel"
          id="credit-card"
          name="creditCard"
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
          placeholder="Enter your credit card number"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
          placeholder="Enter your password"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows="4"
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
          placeholder="Enter your message"
        ></textarea>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
      >
        Submit
      </button>
    </form>
  </div>
);

const Page2 = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const TOKEN_LIMIT = 32000; // Free tier limit for gemini-pro

  // Initialize with welcome message and load saved messages
  useEffect(() => {
    const initializeChatbot = async () => {
      // Check if API key is available via API route
      try {
        const configResponse = await fetch('/api/chat/config');
        const config = await configResponse.json();
        
        if (!config.hasApiKey) {
          setError('API key not configured');
          setMessages([{
            text: "Hello! I'm your AI assistant, but I need an API key to be configured to help you. Please set up your Gemini API key in the environment variables.",
            sender: 'bot',
            timestamp: new Date(),
            isError: true
          }]);
          return;
        }
      } catch (error) {
        console.error('Error checking API key:', error);
        setError('Failed to check API key configuration');
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

I'm your **AI assistant** powered by Google Gemini. I can help you with:

- **Code examples** with syntax highlighting
- **Markdown formatting** for better readability  
- **Tables and lists** for organized information
- **Code blocks** with copy functionality

Try asking me something like:
- "Show me a React component example"
- "Create a table comparing different programming languages"
- "Explain how to use async/await in JavaScript"

How can I help you today?`,
          sender: 'bot',
          timestamp: new Date()
        }]);
      }

      // Initialize the chat session
      try {
        await initializeChat('server-side'); // We'll get the API key from the server
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

  const handleSend = async () => {
    const messageText = input.trim();
    if (!messageText || limitReached) return;

    // Add character limit validation
    if (messageText.length > 1000) {
      setError('Message too long. Please keep it under 1000 characters.');
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
      // Prepare history for the API call
      const history = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Use the API route instead of direct SDK calls
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history, message: messageText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Debug logging
      console.log('Frontend received data:', data);
      console.log('Current tokenCount state:', tokenCount);
      console.log('Received tokenCount from API:', data.tokenCount);
      
      if (data.error) {
        throw new Error(data.error);
      }

      const botMessage = {
        text: data.response || 'I received your message but couldn\'t generate a response.',
        sender: 'bot',
        timestamp: new Date(),
        usage: data.usage
      };

      setMessages([...newMessages, botMessage]);
      
      // Update token count
      if (data.tokenCount) {
        const newTotalTokens = tokenCount + data.tokenCount;
        console.log('Updating token count from', tokenCount, 'to', newTotalTokens);
        setTokenCount(newTotalTokens);
        
        if (newTotalTokens >= TOKEN_LIMIT) {
          setLimitReached(true);
        }
      } else {
        console.log('No tokenCount received from API');
      }
      
      logEvent('Chatbot Response Received', {
        response_length: botMessage.text.length,
        usage: data.usage,
        timestamp: botMessage.timestamp
      });

    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      
      let errorMessage = 'An error occurred while processing your request';
      if (error.message.includes('API_KEY') || error.message.includes('API key')) {
        errorMessage = 'Invalid or missing API key';
      } else if (error.message.includes('QUOTA') || error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later';
      } else if (error.message.includes('RATE_LIMIT')) {
        errorMessage = 'Rate limit exceeded. Please try again later';
      } else if (error.message.includes('SAFETY')) {
        errorMessage = 'Content blocked by safety filters';
      }
      
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

I'm your **AI assistant** powered by Google Gemini. I can help you with:

- **Code examples** with syntax highlighting
- **Markdown formatting** for better readability  
- **Tables and lists** for organized information
- **Code blocks** with copy functionality

Try asking me something like:
- "Show me a React component example"
- "Create a table comparing different programming languages"
- "Explain how to use async/await in JavaScript"

How can I help you today?`,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    localStorage.setItem('chatbot-messages', JSON.stringify([welcomeMessage]));
    setError(null);
    
    // Clear the chat session using the SDK
    clearChatHistory();
    
    logEvent('Chat Cleared', { timestamp: new Date() });
  };

  const handleRestart = () => {
    setMessages([]);
    setTokenCount(0);
    setLimitReached(false);
  };

  return (
    <div className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-semibold">AI Chatbot</h2>
          <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
            isInitialized && !error
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isInitialized && !error ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span>
              {isInitialized && !error ? 'Ready' : 'Initializing...'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tokens: {tokenCount} / {TOKEN_LIMIT}
          </div>
          <button
            onClick={clearChat}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
          >
            Clear Chat
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Note:</strong> {error}
          </p>
        </div>
      )}

      <div className="flex flex-col h-80 bg-gray-100 dark:bg-zinc-700 p-4 rounded-lg overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
            <div className={`p-3 rounded-lg ${msg.sender === 'user' 
              ? 'bg-blue-500 text-white rounded-br-sm' 
              : msg.isError 
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                : 'bg-white dark:bg-zinc-600 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm'
            }`}>
              {msg.sender === 'user' ? (
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="text-sm prose prose-sm max-w-none dark:prose-invert chat-markdown">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom styling for code blocks
                      code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="rounded-md my-2 overflow-hidden relative group">
                            <div className="flex justify-between items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {match[1]}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title="Copy code"
                              >
                                Copy
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? oneDark : oneLight}
                              language={match[1]}
                              PreTag="div"
                              className="!m-0 !p-3"
                              customStyle={{
                                margin: 0,
                                padding: '0.75rem',
                                background: 'transparent',
                                fontSize: '0.875rem',
                                lineHeight: '1.5'
                              }}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs" {...props}>
                            {children}
                          </code>
                        );
                      },
                      // Custom styling for pre blocks
                      pre: ({ children }) => (
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 my-2 overflow-x-auto">
                          <pre className="text-sm">{children}</pre>
                        </div>
                      ),
                      // Custom styling for blockquotes
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic text-gray-600 dark:text-gray-400">
                          {children}
                        </blockquote>
                      ),
                      // Custom styling for tables
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                          <table className="min-w-full border border-gray-300 dark:border-gray-600">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-left">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                          {children}
                        </td>
                      ),
                      // Custom styling for lists
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside my-2 space-y-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside my-2 space-y-1">
                          {children}
                        </ol>
                      ),
                      // Custom styling for links
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {children}
                        </a>
                      ),
                      // Custom styling for headings
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold my-2">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold my-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-bold my-2">{children}</h3>
                      ),
                      // Custom styling for horizontal rules
                      hr: () => (
                        <hr className="border-gray-300 dark:border-gray-600 my-3" />
                      ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            <span className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 self-start">
            <div className="bg-white dark:bg-zinc-600 p-3 rounded-lg rounded-bl-sm shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
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
            className="flex-grow rounded-md border border-gray-300 shadow-sm p-3 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type your message... (Press Enter to send)"
            disabled={isLoading}
            maxLength={1000}
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition flex items-center space-x-2"
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
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        {input.length}/1000 characters
      </div>
    </div>
  );
};

const Page3 = () => {
  const [sliderValue, setSliderValue] = useState(50);
  const [toggleOn, setToggleOn] = useState(false);

  const handleSliderChange = (e) => {
    const value = e.target.value;
    setSliderValue(value);
    logEvent('Slider Interacted', { value });
  };

  const handleToggle = () => {
    const newValue = !toggleOn;
    setToggleOn(newValue);
    logEvent('Toggle Interacted', { on: newValue });
  };

  return (
    <div className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
      <h2 className="text-2xl font-semibold mb-3">Interactive Elements</h2>
      <div className="space-y-6">
        <div>
          <label htmlFor="slider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Slider
          </label>
          <input
            type="range"
            id="slider"
            name="slider"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Value: {sliderValue}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Toggle Switch</span>
          <label htmlFor="toggle" className="inline-flex relative items-center cursor-pointer">
            <input type="checkbox" id="toggle" className="sr-only peer" checked={toggleOn} onChange={handleToggle} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Track page view
    analytics.page("Home Page", {
      path: window.location.pathname,
      url: window.location.href,
      title: document.title
    });

    // Track card clicks
    const handleCardClick = (event) => {
      const card = event.currentTarget;
      const title = card.querySelector('.card-title').textContent;
      const content = card.querySelector('.card-text').textContent;
      logEvent("Card Clicked", { title: title, content: content });
    };

    const handleButtonClick = (event) => {
      const button = event.target;
      const buttonText = button.textContent.trim();
      const buttonType = button.type || 'button';
      const buttonId = button.id || '';
      const isFormSubmit = buttonType === 'submit';
      
      logEvent("Button Clicked", {
        button_text: buttonText,
        button_id: buttonId,
        button_type: buttonType,
        is_submit: isFormSubmit,
        button_class: button.className,
        form_id: button.form?.id || ''
      });

      if (buttonId === 'track-exposure-btn') {
        trackExposure()
      }
    };

    const handleInputFocus = (event) => {
      logEvent("Form Field Focused", { 
        field: event.target.name,
        field_type: event.target.type,
        label: event.target.labels?.[0]?.textContent?.trim()
      });
    };

    const handleInputBlur = (event) => {
      logEvent("Form Input Entered", { 
        field: event.target.name,
        field_type: event.target.type,
        value: event.target.type === 'password' ? '[REDACTED]' : event.target.value,
        label: event.target.labels?.[0]?.textContent?.trim()
      });
    };
    
    const handleFormSubmit = (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const formFields = {};
      formData.forEach((value, key) => {
        formFields[key] = key.includes('password') || key.includes('credit') ? '[REDACTED]' : value;
      });
      
      logEvent("Form Submitted", {
        form_id: event.target.id || 'main-form',
        fields: formFields
      });
    };
    
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('click', handleCardClick);
    });

    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', handleButtonClick);
    });

   const inputs = document.querySelectorAll('input, textarea');
   inputs.forEach(input => {
     input.addEventListener('focus', handleInputFocus);
     input.addEventListener('blur', handleInputBlur);
   });

   const form = document.querySelector('form');
   if (form) {
     form.addEventListener('submit', handleFormSubmit);
   }

    return () => {
      cards.forEach(card => {
        card.removeEventListener('click', handleCardClick);
      });
      buttons.forEach(button => {
        button.removeEventListener('click', handleButtonClick);
      });
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus);
        input.removeEventListener('blur', handleInputBlur);
      });

      const form = document.querySelector('form');
      if (form) {
        form.removeEventListener('submit', handleFormSubmit);
      }
    };
  }, []);

  return (
    <>
      <AnalyticsProvider />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
          <p className="amp-unmask fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            This is unmasked.
          </p>
        </div>
        <br />

        <div className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setPage(1)}
              className={`font-bold py-2 px-4 rounded-lg transition ${page === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-zinc-700'}`}
            >
              Page 1
            </button>
            <button
              onClick={() => setPage(2)}
              className={`font-bold py-2 px-4 rounded-lg transition ${page === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-zinc-700'}`}
            >
              Page 2
            </button>
            <button
              onClick={() => setPage(3)}
              className={`font-bold py-2 px-4 rounded-lg transition ${page === 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-zinc-700'}`}
            >
              Page 3
            </button>
          </div>
        </div>

        {page === 1 && <Page1 />}
        {page === 2 && <Page2 />}
        {page === 3 && <Page3 />}
      </main>
    </>
  )
}
