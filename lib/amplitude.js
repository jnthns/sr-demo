import { useEffect } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { v4 as uuidv4 } from 'uuid';

let sessionReplay, Experiment, engagementInit;
if (typeof window !== 'undefined') {
  sessionReplay = require('@amplitude/session-replay-browser');
  Experiment = require('@amplitude/experiment-js-client').Experiment;
  engagementInit = require('@amplitude/engagement-browser').init;
}
import { waitForIndexedDB } from '../lib/idb';

const SEGMENT_WRITE_KEY = '8bgHnHzXPcTgha4ESviQehYYhGDWKxLu'; 
const AMPLITUDE_API_KEY = 'a1e47468f1a2a0f73ee870f492893abb'; 

export const deviceId = uuidv4();
export const sessionId = Date.now();
export const analytics = (typeof window !== 'undefined')
  ? AnalyticsBrowser.load({ writeKey: SEGMENT_WRITE_KEY })
  : {
      track: () => {},
      page: () => {},
      on: () => {},
      ready: (cb) => { if (cb) { cb() } },
    };
export const flag = "test"

export let experimentInstance = null;
let experimentReadyResolve;
export const experimentReady = new Promise((resolve) => {
  experimentReadyResolve = resolve;
});

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
          analytics.track(event.event_type, event.event_properties)
        }
      },
    ],
  });

  analytics.on('track', (event, properties, options) => {
    window.engagement.forwardEvent({ event_type: event, event_properties: properties});
  });
 
  analytics.on('page', (event, properties, options) => {
    window.engagement.forwardEvent({ event_type: event, event_properties: properties});
  });

  // Experiment Init & Exposure tracking hook
  analytics.ready(() => {
    experimentInstance = Experiment.initialize(AMPLITUDE_API_KEY, {
      exposureTrackingProvider: {
        track: (exposure) => {
          analytics.track('$exposure', exposure);
        },
      },
    });

    experimentReadyResolve();
  });
};

export async function trackExposure() {
  if (!experimentInstance) {
    await experimentReady;
  }

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

  analytics.track(
    event,
    { ...eventProps, ...replayProps },
    {
      anonymousId: deviceId
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
