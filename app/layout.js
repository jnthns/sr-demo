import { Inter } from "next/font/google";
import Script from "next/script";
import Navigation from "./components/Navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const AMPLITUDE_API_KEY = 'a1e47468f1a2a0f73ee870f492893abb';

export const metadata = {
  title: "Jon Test App",
  description: "Example site for Amplitude testing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Amplitude Web Experiment Script - loads before page becomes interactive */}
        <Script
          src={`https://cdn.amplitude.com/script/${AMPLITUDE_API_KEY}.experiment.js`}
          strategy="beforeInteractive"
          async
        />
        <Navigation />
        {children}
      </body>
    </html>
  );
}
