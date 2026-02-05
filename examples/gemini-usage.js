// Examples of using the Gemini API with different approaches
import { GoogleGenAI } from '@google/genai';
import { sendMessageSimple, sendMessageDirect, initializeChat, sendMessage } from '../lib/geminichat.js';

// Example 1: Simple approach matching Google's documentation
async function simpleExample() {
  const ai = new GoogleGenAI({}); // Assumes GEMINI_API_KEY is set

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'why is the sky blue?',
    });

    console.log(response.text); // output is often markdown
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 2: Using our simple wrapper (matches Google's approach)
async function simpleWrapperExample() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  try {
    const result = await sendMessageSimple('why is the sky blue?', apiKey);
    console.log(result.text);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 3: Using our advanced wrapper with system prompts and configuration
async function advancedWrapperExample() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  try {
    const result = await sendMessageDirect('why is the sky blue?', apiKey, 
      'You are a helpful science tutor. Explain concepts clearly and simply.');
    console.log(result.text);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 4: Using chat sessions for multi-turn conversations
async function chatSessionExample() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  try {
    // Initialize a chat session
    await initializeChat(apiKey, 'You are a helpful coding assistant.');
    
    // Send multiple messages in the same conversation
    const response1 = await sendMessage('What is React?');
    console.log('Response 1:', response1.text);
    
    const response2 = await sendMessage('How do I create a component?');
    console.log('Response 2:', response2.text);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples (uncomment the one you want to test)
// simpleExample();
// simpleWrapperExample();
// advancedWrapperExample();
// chatSessionExample();
