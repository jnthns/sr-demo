'use client'

import { useEffect } from "react";
import Image from "next/image";
import { logEvent } from "../lib/amplitude"
import Amplitude from "../lib/amplitude"

export default function Home() {
  useEffect(() => {
  // 3/2025: replacing with autocapture
  //   // Track card clicks
  //   const handleCardClick = (event) => {
  //     const card = event.currentTarget;
  //     const title = card.querySelector('.card-title').textContent;
  //     const content = card.querySelector('.card-text').textContent;
  //     logEvent("Card Clicked", { title: title, content: content });
  //   };

  //   const handleButtonClick = (event) => {
  //     logEvent("Form Submitted", { buttonText: event.target.id });
  //   };

  //   const handleInputBlur = (event) => {
  //     logEvent("Form Input Entered", { field: event.target.name, value: event.target.value });
  //   };
    
  //   const cards = document.querySelectorAll('.card');
  //   cards.forEach(card => {
  //     card.addEventListener('click', handleCardClick);
  //   });

  //   const buttons = document.querySelectorAll('button');
  //   buttons.forEach(button => {
  //     button.addEventListener('click', handleButtonClick);
  //   });

  //  const inputs = document.querySelectorAll('input, textarea');
  //  inputs.forEach(input => {
  //    input.addEventListener('blur', handleInputBlur);
  //  });

  //   return () => {
  //     cards.forEach(card => {
  //       card.removeEventListener('click', handleCardClick);
  //     });
  //     buttons.forEach(button => {
  //       button.removeEventListener('click', handleButtonClick);
  //     });
  //     inputs.forEach(input => {
  //       input.removeEventListener('blur', handleInputBlur);
  //     });
    // };
  }, []);

  return (
    <>
      <Amplitude />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
          <p className="amp-unmask fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            This is unmasked.
          </p>
        </div>
        <br />

        {/* New Form Section */}
        <div className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
          <h2 className="text-2xl font-semibold mb-3">Example Form</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Duis sollicitudin, 
            nunc sit amet hendrerit volutpat, nisi nunc varius lacus, a pharetra felis lacus et eros.
          </p>

          {/* Row of Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition">
              Button 1
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
      </main>
    </>
  )
}
