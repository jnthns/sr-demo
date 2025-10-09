import { useEffect } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import * as sessionReplay from "@amplitude/session-replay-browser";
import { Experiment } from '@amplitude/experiment-js-client';
import { plugin as engagementPlugin } from '@amplitude/engagement-browser';
import { v4 as uuidv4 } from 'uuid';
import { waitForIndexedDB } from '../lib/idb';

const AMPLITUDE_API_KEY = 'a1e47468f1a2a0f73ee870f492893abb'; 

export const deviceId = uuidv4();
export const sessionId = Date.now();
export const flag = "test"
export const guide = "guide-experiment-guide"
let experimentInstance = null;

const user = {
  // user_id: 'Twilion',
  device_id: deviceId,
  user_properties: {
    // "account": 1234,
    // "twilio_plan": "pro"
  }
}

console.log("Device ID is: " + deviceId);
console.log("Session ID is: " + sessionId);

const initializeAnalytics = async () => {
  await waitForIndexedDB();

  // Initialize Amplitude Browser SDK 2
  amplitude.init(AMPLITUDE_API_KEY, {
    // userId: 'Twilion',
    deviceId: deviceId,
    sessionId: sessionId,
    autocapture: {
      attribution: false,
      pageViews: false, // We handle page views manually
      sessions: false,
      fileDownloads: false,
      formInteractions: false, // We handle form interactions manually
      elementInteractions: false
    }
  });

  console.log("Amplitude Browser SDK 2 initialized");

  sessionReplay.init(AMPLITUDE_API_KEY, {
    deviceId,
    sessionId,
    optOut: false,
    sampleRate: 1
  }).promise;

  sessionReplay.setSessionId(sessionId);
  console.log("Session Replay initialized");

  // Initialize G&S
  amplitude.add(engagementPlugin());
  
  window.engagement.boot({
    user: {
      device_id: deviceId,
      // user_properties: {"company": "udemy"},
    },
    integrations: [
      {
        track: (event) => {
          console.log("Tracking event", event);
          amplitude.track(event.event_type, event.event_properties)
        }
      },
    ],
  }).then(() => {
    engagement._setUserProperties({"company":"udemy"})
  });
  
  // Initialize Experiment with Amplitude tracking
  experimentInstance = Experiment.initializeWithAmplitudeAnalytics(AMPLITUDE_API_KEY);
};

export async function trackExposure() {
  try {
    await experimentInstance.fetch(user);
    const variant = experimentInstance.variant(guide);
    const variantValue = variant.value;
    console.log("Variant value is: " + variantValue);
    
    setTimeout(function () {
      if (variant.value === 'treatment') {
        console.log(variant.value)
        console.log(variant.payload)
        alert('Your variant is treatment');
        engagement.gs.show(variant.value);
      } else {
        console.log(variant.value)
        console.log(variant.payload)
        alert('Your variant is control');
        engagement.gs.show(variant.value)
      }
    }, 500);
    // if (variantValue === 'control') {
    //   alert('Your variant is control');
    //   engagement.gs.showGuide(guide);
    // } else if (variantValue === 'treatment') {
    //   alert('Your variant is treatment');
    //   engagement.gs.showGuide(guide);
    // } else if (variantValue === '{}') {
    //   alert('You did not receive a variant');
    // }

  } catch (err) {
    console.error('Exposure tracking failed', err);
  }
}

export const logEvent = (event, eventProps = {}) => {
  const replayProps = sessionReplay.getSessionReplayProperties();

  amplitude.track(
    event,
    { ...eventProps, ...replayProps },
    {
      device_id: deviceId
    }
  );

  return true;
};

// Helper function for page tracking
export const trackPage = (pageName, pageProps = {}) => {
  const replayProps = sessionReplay.getSessionReplayProperties();
  
  amplitude.track(
    'Page Viewed',
    { 
      page_name: pageName,
      ...pageProps, 
      ...replayProps 
    },
    {
      device_id: deviceId
    }
  );
  return true;
};

const AnalyticsProvider = () => {
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return null;
};

export default AnalyticsProvider;
