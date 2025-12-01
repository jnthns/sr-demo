import { useEffect } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';
import * as amplitude from '@amplitude/analytics-browser';
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
// Segment
// export const analytics = (typeof window !== 'undefined')
//   ? AnalyticsBrowser.load({ writeKey: SEGMENT_WRITE_KEY })
//   : {
//       track: () => {},
//       page: () => {},
//       on: () => {},
//       ready: (cb) => { if (cb) { cb() } },
//     };
// Amplitude - initialize the SDK
amplitude.init(AMPLITUDE_API_KEY, {
  autocapture: {
    "attribution": true,
    "pageViews": true,
    "formInteractions": true,
    "frustrationInteractions": true,
    "elementInteractions": false
  }
});

// Event listeners storage for Segment-compatible API
const eventListeners = {
  track: [],
  page: []
};

// Create a Segment-compatible wrapper for easier migration
export const analytics = {
  track: (eventName, eventProperties = {}, options = {}) => {
    amplitude.track(eventName, eventProperties);
    // Trigger registered 'track' listeners
    eventListeners.track.forEach(callback => {
      try {
        callback(eventName, eventProperties, options);
      } catch (error) {
        console.error('Error in track listener:', error);
      }
    });
  },
  page: (eventName, properties = {}) => {
    amplitude.track('Page Viewed', {
      ...properties,
      page_name: eventName
    });
    // Trigger registered 'page' listeners
    eventListeners.page.forEach(callback => {
      try {
        callback(eventName, properties, {});
      } catch (error) {
        console.error('Error in page listener:', error);
      }
    });
  },
  on: (eventType, callback) => {
    if (eventListeners[eventType]) {
      eventListeners[eventType].push(callback);
    } else {
      console.warn(`Unknown event type: ${eventType}`);
    }
  },
  ready: (callback) => {
    // Amplitude initializes synchronously, so call immediately
    if (callback) {
      setTimeout(callback, 0);
    }
  }
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

  // Detect browser locale with fallback to en-US
  const getBrowserLocale = () => {
    if (typeof window !== 'undefined' && navigator.language) {
      return navigator.language;
    }
    return "en-US";
  };

  engagementInit(AMPLITUDE_API_KEY, {
    serverZone: "US",
    logger: console,
    logLevel: "info",
    locale: getBrowserLocale()
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

export async function fetchVariant(customUserProperties = {}) {
  if (!experimentInstance) {
    await experimentReady;
  }

  try {
    const userWithCustomProps = {
      ...user,
      user_properties: {
        ...user.user_properties,
        ...customUserProperties
      }
    };

    await experimentInstance.fetch(userWithCustomProps);
    const variant = experimentInstance.variant(flag);
    const variantValue = variant.value;
    
    console.log("Variant value with custom properties:", variantValue);
    console.log("User properties used:", userWithCustomProps.user_properties);

    return {
      success: true,
      variant: variantValue,
      userProperties: userWithCustomProps.user_properties,
      metadata: variant.metadata || {}
    };

  } catch (err) {
    console.error('Variant fetch failed', err);
    return {
      success: false,
      error: err.message,
      variant: null,
      userProperties: customUserProperties
    };
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
