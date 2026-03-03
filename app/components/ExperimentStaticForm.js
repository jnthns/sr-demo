export default function ExperimentStaticForm() {
  return (
    <div className="w-full max-w-3xl bg-zen-100 glass-card rounded-2xl border border-zen-200 p-6 mb-6">
      <h3 className="text-lg font-medium text-zen-800 mb-3">Example Form</h3>
      <p className="text-zen-500 mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Duis sollicitudin,
        nunc sit amet hendrerit volutpat, nisi nunc varius lacus, a pharetra felis lacus et eros.
      </p>

      <div className="flex justify-center gap-4 mb-6">
        <button
          id="track-exposure-btn"
          className="bg-matcha-500 hover:bg-matcha-600 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          Track Exposure
        </button>
        <button className="bg-glow-500 hover:bg-glow-600 text-white font-medium py-2 px-4 rounded-lg transition">
          Button 2
        </button>
        <button className="bg-zen-300 hover:bg-zen-400 text-zen-900 font-medium py-2 px-4 rounded-lg transition">
          Button 3
        </button>
      </div>

      <div className="mb-4">
        <ul className="list-disc list-inside text-matcha-400">
          <li>
            <a href="https://www.amplitude.com/docs/session-replay" target="_blank" rel="noopener noreferrer" className="hover:text-matcha-300 hover:underline">
              Amplitude Session Replay
            </a>
          </li>
          <li>
            <a href="https://www.amplitude.com" target="_blank" rel="noopener noreferrer" className="hover:text-matcha-300 hover:underline">
              Example Link
            </a>
          </li>
        </ul>
      </div>

      <form className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zen-600">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="mt-1 block w-full rounded-lg border border-zen-300 bg-zen-100 p-2 text-sm text-zen-800 placeholder:text-zen-400 focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zen-600">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="mt-1 block w-full rounded-lg border border-zen-300 bg-zen-100 p-2 text-sm text-zen-800 placeholder:text-zen-400 focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-zen-600">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="mt-1 block w-full rounded-lg border border-zen-300 bg-zen-100 p-2 text-sm text-zen-800 placeholder:text-zen-400 focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label htmlFor="credit-card" className="block text-sm font-medium text-zen-600">
            Credit Card Number
          </label>
          <input
            type="tel"
            id="credit-card"
            name="creditCard"
            className="mt-1 block w-full rounded-lg border border-zen-300 bg-zen-100 p-2 text-sm text-zen-800 placeholder:text-zen-400 focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
            placeholder="Enter your credit card number"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zen-600">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="mt-1 block w-full rounded-lg border border-zen-300 bg-zen-100 p-2 text-sm text-zen-800 placeholder:text-zen-400 focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
            placeholder="Enter your password"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-zen-600">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="4"
            className="mt-1 block w-full rounded-lg border border-zen-300 bg-zen-100 p-2 text-sm text-zen-800 placeholder:text-zen-400 focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
            placeholder="Enter your message"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-matcha-500 to-glow-500 hover:from-matcha-600 hover:to-glow-600 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
