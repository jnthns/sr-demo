'use client'

import { useState, useEffect } from "react";
import { logEvent, trackExposure, analytics } from "../lib/amplitude"
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

  // Initialize with welcome message and load saved messages
  useEffect(() => {
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
        text: "Hello! I'm your AI assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatbot-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSend = async () => {
    const messageText = input.trim();
    if (!messageText) return;

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const botMessage = {
        text: data.response || 'I received your message but couldn\'t generate a response.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages([...newMessages, botMessage]);
      
      logEvent('Chatbot Response Received', {
        response_length: botMessage.text.length,
        timestamp: botMessage.timestamp
      });

    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      
      let errorMessage = 'Sorry, something went wrong.';
      
      if (error.message.includes('API key')) {
        errorMessage = 'API key not configured. Please set up your Gemini API key to use the chatbot.';
        setError('API key not configured');
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the chat service. Please check your internet connection.';
      }

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
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    localStorage.setItem('chatbot-messages', JSON.stringify([welcomeMessage]));
    setError(null);
    logEvent('Chat Cleared', { timestamp: new Date() });
  };

  return (
    <div className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-semibold">AI Chatbot</h2>
        <button
          onClick={clearChat}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
        >
          Clear Chat
        </button>
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
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
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
  };

  const handleSliderEnd = (e) => {
    const value = e.target.value;
    logEvent('Slider Value Set', { final_value: value });
  };

  const handleToggle = () => {
    const newValue = !toggleOn;
    setToggleOn(newValue);
    logEvent('Toggle Set', { on: newValue });
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
             onMouseUp={handleSliderEnd}
             onTouchEnd={handleSliderEnd}
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
