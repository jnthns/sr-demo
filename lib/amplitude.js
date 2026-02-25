import { useEffect } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { v4 as uuidv4 } from 'uuid';
import { waitForIndexedDB } from '../lib/idb';

const AMPLITUDE_API_KEY = 'a1e47468f1a2a0f73ee870f492893abb';
let hasInitializedAnalytics = false;

export const deviceId = uuidv4();
export const sessionId = Date.now();
export const flag = "test"

export let experimentInstance = null;
let experimentReadyResolve;
export const experimentReady = new Promise((resolve) => {
  experimentReadyResolve = resolve;
});

const user = {
  user_id: "sr-demo-user",
  device_id: deviceId,
  user_properties: {}
}

console.log("Device ID is: " + deviceId);
console.log("Session ID is: " + sessionId);

const initializeAnalytics = async () => {
  console.log("[amp] initializeAnalytics called, hasInit:", hasInitializedAnalytics);
  if (hasInitializedAnalytics || typeof window === 'undefined') {
    return;
  }

  await waitForIndexedDB();
 
  amplitude.setOptOut(false);
  amplitude.init(AMPLITUDE_API_KEY, user.user_id, {
    autocapture: {
      pageViews: true,
      elementInteractions: false,
      webVitals: true
    },
    serverUrl: 'https://api2.amplitude.com/2/httpapi',
    optOut: false
  });
  hasInitializedAnalytics = true;

  // Session Replay plugin (optional, does not block tracking)
  try {
    const { sessionReplayPlugin } = await import('@amplitude/plugin-session-replay-browser');
    amplitude.add(sessionReplayPlugin({ sampleRate: 1, optOut: false }));
    console.log("Session Replay initialized via plugin");
  } catch (err) {
    console.warn("Session Replay plugin failed to load:", err);
  }

  // Engagement plugin (optional, does not block tracking)
  try {
    const { plugin: engagementPlugin } = await import('@amplitude/engagement-browser');
    amplitude.add(engagementPlugin({ serverZone: "US", locale: "en-US" }));
    console.log("Engagement plugin initialized");
  } catch (err) {
    console.warn("Engagement plugin failed to load:", err);
  }

  // Experiment SDK
  try {
    const { Experiment } = await import('@amplitude/experiment-js-client');
    experimentInstance = Experiment.initialize(AMPLITUDE_API_KEY);
  } catch (err) {
    console.warn("Experiment SDK failed to load:", err);
  }

  experimentReadyResolve();
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
  amplitude.track(event, eventProps);
};

const AnalyticsProvider = () => {
  useEffect(() => {
    initializeAnalytics().then(() => {
      logEvent("Analytics Initialized");
    });
  }, []);

  return null;
};

export default AnalyticsProvider;
