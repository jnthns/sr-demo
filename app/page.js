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

  const handleSend = () => {
    if (input.trim()) {
      const newMessages = [...messages, { text: input, sender: 'user' }];
      setMessages(newMessages);
      setInput('');
      logEvent('Chatbot Message Sent', { message: input });

      setTimeout(() => {
        setMessages([...newMessages, { text: 'This is a mocked response.', sender: 'bot' }]);
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
      <h2 className="text-2xl font-semibold mb-3">Chatbot</h2>
      <div className="flex flex-col h-80 bg-gray-100 dark:bg-zinc-700 p-4 rounded-lg overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className={`p-2 rounded-lg mb-2 ${msg.sender === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 dark:bg-zinc-600 self-start'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-grow rounded-l-md border border-gray-300 shadow-sm p-2 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-md transition"
        >
          Send
        </button>
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
