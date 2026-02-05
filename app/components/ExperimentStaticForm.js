export default function ExperimentStaticForm() {
  return (
    <div className="w-full max-w-3xl bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg mb-10">
      <h3 className="text-xl font-semibold mb-3">Example Form</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Duis sollicitudin,
        nunc sit amet hendrerit volutpat, nisi nunc varius lacus, a pharetra felis lacus et eros.
      </p>

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
}
