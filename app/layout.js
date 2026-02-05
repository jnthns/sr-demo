import { Inter } from "next/font/google";
import Navigation from "./components/Navigation";
import AnalyticsBootstrap from "./components/AnalyticsBootstrap";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const AMPLITUDE_API_KEY = 'a1e47468f1a2a0f73ee870f492893abb';

export const metadata = {
  title: "Jon Test App",
  description: "Example site for Amplitude testing",
};

export default function RootLayout({ children }) {
  const antiFlickerScript = `
    (function(d, h){
      var apiKey = "${AMPLITUDE_API_KEY}";
      var timeout = 200;
      var id = "amp-exp-css";
      try {
        if (!d.getElementById(id)) {
          var st = d.createElement("style");
          st.id = id;
          st.innerText = "* { visibility: hidden !important; background-image: none !important; }";
          h.appendChild(st);
          window.setTimeout(function () {st.remove()}, timeout);
          var sc = d.createElement("script");
          sc.src = "https://cdn.amplitude.com/script/" + apiKey + ".experiment.js";
          sc.async = true;
          sc.onerror = function () {st.remove()};
          h.insertBefore(sc, d.currentScript || h.lastChild);
        }
      } catch(e) {console.error(e)}
    })(document, document.head);
  `;

  return (
    <html lang="en">
      <head>
        {/* Amplitude Web Experiment Anti-Flicker Snippet */}
        <script
          dangerouslySetInnerHTML={{
            __html: antiFlickerScript,
          }}
        />
      </head>
      <body className={inter.className}>
        <Navigation />
        <AnalyticsBootstrap />
        {children}
      </body>
    </html>
  );
}
