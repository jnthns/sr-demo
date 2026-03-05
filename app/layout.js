import { Inter } from "next/font/google";
import Navigation from "./components/Navigation";
import AnalyticsBootstrap from "./components/AnalyticsBootstrap";
import SettingsProvider from "./components/SettingsProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

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
    <html lang="en" data-theme="dark">
      <head>
        {/* Apply saved theme before paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem('app-settings'));if(s){if(s.theme)document.documentElement.setAttribute('data-theme',s.theme);var r=document.documentElement.style;if(s.auroraColor1){var h=function(c){var v=parseInt(c.slice(1,3),16)+', '+parseInt(c.slice(3,5),16)+', '+parseInt(c.slice(5,7),16);return v};r.setProperty('--aurora-1',h(s.auroraColor1));r.setProperty('--aurora-2',h(s.auroraColor2))}if(s.auroraIntensity!=null)r.setProperty('--aurora-intensity',String(s.auroraIntensity));if(s.glassBlur!=null)r.setProperty('--glass-blur',String(s.glassBlur))}}catch(e){}`,
          }}
        />
        {/* Amplitude Web Experiment Anti-Flicker Snippet */}
        <script
          dangerouslySetInnerHTML={{
            __html: antiFlickerScript,
          }}
        />
      </head>
      <body className={`${inter.className} text-zen-800`}>
        <SettingsProvider>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 min-w-0 overflow-auto">
              <AnalyticsBootstrap />
              {children}
            </main>
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}
