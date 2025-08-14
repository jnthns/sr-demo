import { useEffect } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import * as sessionReplay from "@amplitude/session-replay-browser";
import { Experiment } from '@amplitude/experiment-js-client';
import { init as engagementInit } from '@amplitude/engagement-browser';
import { v4 as uuidv4 } from 'uuid';
import { waitForIndexedDB } from '../lib/idb';

const AMPLITUDE_API_KEY = 'a1e47468f1a2a0f73ee870f492893abb'; 

export const deviceId = uuidv4();
export const sessionId = Date.now();
export const flag = "test"
let experimentInstance = null;

const user = {
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
    deviceId: deviceId,
    sessionId: sessionId,
    autocapture: {
      attribution: true,
      pageViews: false, // We handle page views manually
      sessions: false,
      fileDownloads: false,
      formInteractions: false, // We handle form interactions manually
      elementInteractions: false
    }
  });

  console.log("Amplitude Browser SDK 2 initialized");

  await sessionReplay.init(AMPLITUDE_API_KEY, {
      deviceId,
      sessionId,
      optOut: false,
      sampleRate: 1
    })
    .promise;

  sessionReplay.setSessionId(sessionId);
  console.log("Session Replay initialized");

  engagementInit(AMPLITUDE_API_KEY, {
    serverZone: "US",
    logger: console,
    logLevel: "info",
    locale: "en-US"
  });

  await window.engagement.boot({
    user: user, 
    integrations: [
      {
        track: (event) => {
          amplitude.track(event.event_type, event.event_properties)
        }
      },
    ],
  });

  // Forward Amplitude events to Engagement
  amplitude.add({
    name: 'engagement-forwarder',
    type: 'after',
    setup() {
      return {
        execute: (context) => {
          if (context.event && context.event.event_type && window.engagement) {
            window.engagement.forwardEvent({ 
              event_type: context.event.event_type, 
              event_properties: context.event.event_properties || {}
            });
          }
          return context;
        }
      };
    }
  });

  // Initialize Experiment with Amplitude tracking
  experimentInstance = Experiment.initializeWithAmplitudeAnalytics(AMPLITUDE_API_KEY);
};

export async function trackExposure() {
  try {
    await experimentInstance.fetch(user);
    const variant = experimentInstance.variant(flag);
    const variantValue = variant.value;
    console.log("Variant value is: " + variantValue);
    
    if (variantValue === 'control') {
      alert('Your variant is control');
    } else if (variantValue === 'treatment') {
      alert('Your variant is treatment');
    } else if (variantValue === '{}') {
      alert('You did not receive a variant');
    }

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
};

const AnalyticsProvider = () => {
  useEffect(() => {
    initializeAnalytics();
  }, []);

  return null;
};

export default AnalyticsProvider;
