'use client'

import { useState, useEffect } from "react";
import { logEvent, trackExposure, fetchVariant, analytics } from "../lib/amplitude"
import AnalyticsProvider from "../lib/amplitude"

const Page1 = () => {
  const [variantInfo, setVariantInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProperties, setUserProperties] = useState({
    account_tier: '',
    plan_type: '',
    user_segment: ''
  });

  const handleFetchVariant = async () => {
    setIsLoading(true);
    try {
      const result = await fetchVariant(userProperties);
      setVariantInfo(result);
      
      logEvent('Experiment Fetch Triggered', {
        user_properties: userProperties,
        variant: result.variant,
        success: result.success
      });
    } catch (error) {
      console.error('Error fetching variant:', error);
      setVariantInfo({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPropertyChange = (key, value) => {
    setUserProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getVariantDisplayColor = (variant) => {
    if (!variant || variant === '{}' || variant === 'undefined') {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    }
    if (variant === 'control') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (variant !== ('control')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  };

  return (
    <div className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
      <h2 className="text-2xl font-semibold mb-3">A/B Test & Feature Flag Playground</h2>
      
      {/* Experiment Controls Section */}
      <div className="mb-8 p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Experiment Controls</h3>
        
        {/* Current Variant Display */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Variant:</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getVariantDisplayColor(variantInfo?.variant)}`}>
              {variantInfo?.variant || 'Not fetched'}
            </div>
          </div>
          {variantInfo?.metadata && Object.keys(variantInfo.metadata).length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Metadata: {JSON.stringify(variantInfo.metadata)}
            </div>
          )}
        </div>

        {/* Experiment Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleFetchVariant}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching...</span>
              </>
            ) : (
              <span>Fetch Variant</span>
            )}
          </button>
          
          <button
            onClick={trackExposure}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Track Exposure
          </button>
        </div>

        {/* Error Display */}
        {variantInfo?.success === false && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-200">
            Error: {variantInfo.error}
          </div>
        )}
      </div>

      {/* User Properties Section */}
      <div className="mb-8 p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">User Properties for Targeting</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="account_tier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Tier
            </label>
            <select
              id="account_tier"
              value={userProperties.account_tier}
              onChange={(e) => handleUserPropertyChange('account_tier', e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm dark:bg-zinc-600 dark:border-zinc-500 dark:text-white"
            >
              <option value="">Select tier</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="plan_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plan Type
            </label>
            <select
              id="plan_type"
              value={userProperties.plan_type}
              onChange={(e) => handleUserPropertyChange('plan_type', e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm dark:bg-zinc-600 dark:border-zinc-500 dark:text-white"
            >
              <option value="">Select plan</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="user_segment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User Segment
            </label>
            <select
              id="user_segment"
              value={userProperties.user_segment}
              onChange={(e) => handleUserPropertyChange('user_segment', e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm dark:bg-zinc-600 dark:border-zinc-500 dark:text-white"
            >
              <option value="">Select segment</option>
              <option value="new_user">New User</option>
              <option value="returning_user">Returning User</option>
              <option value="power_user">Power User</option>
              <option value="churned_user">Churned User</option>
            </select>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3">Example Form</h3>
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
};

export default function Home() {
  useEffect(() => {
    // // Track page view
    // analytics.page("Experiments Page", {
    //   path: window.location.pathname,
    //   url: window.location.href,
    //   title: document.title
    // });

    // Track button clicks
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

        <Page1 />
      </main>
    </>
  )
}
