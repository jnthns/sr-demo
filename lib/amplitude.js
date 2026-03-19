import { useEffect } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { v4 as uuidv4 } from 'uuid';
import { waitForIndexedDB } from '../lib/idb';

const SEGMENT_WRITE_KEY = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY;
const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

let hasInitializedAnalytics = false;

export const deviceId = uuidv4();
export const sessionId = Date.now();
export const flag = "test";

export let experimentInstance = null;
let experimentReadyResolve;
export const experimentReady = new Promise((resolve) => {
  experimentReadyResolve = resolve;
});

const userId = 'sr-demo-user';

const user = {
  user_id: userId,
  device_id: deviceId,
  user_properties: {}
};

console.log("Device ID is: " + deviceId);
console.log("Session ID is: " + sessionId);

// Exported so callers can use analytics.track() directly
export const analytics = AnalyticsBrowser.load({ writeKey: SEGMENT_WRITE_KEY });

const initializeAnalytics = async () => {
  console.log("[seg] initializeAnalytics called, hasInit:", hasInitializedAnalytics);
  if (hasInitializedAnalytics || typeof window === 'undefined') {
    return;
  }
  hasInitializedAnalytics = true;

  await waitForIndexedDB();

  await analytics.identify(userId, { deviceId });

  console.group('[seg] SDK ready — identity snapshot');
  console.log('user_id:   ', userId);
  console.log('device_id: ', deviceId);
  console.log('session_id:', sessionId);
  fetch('https://api.ipify.org?format=json')
    .then((r) => r.json())
    .then(({ ip }) => console.log('client ip (ipify):', ip))
    .catch(() => {});
  console.groupEnd();

  // --- Session Replay via Amplitude Segment plugin (Amplitude Actions destination) ---
  try {
    const { createSegmentActionsPlugin } = await import('@amplitude/segment-session-replay-plugin');
    createSegmentActionsPlugin({
      segmentInstance: analytics,
      amplitudeApiKey: AMPLITUDE_API_KEY,
      sessionReplayOptions: {
        sampleRate: 1,
      },
    });
    console.log('[seg] Session Replay Segment plugin initialized');
  } catch (err) {
    console.warn('Session Replay Segment plugin failed to load:', err);
  }

  // --- Experiment SDK ---
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

// Kept as a convenience wrapper so existing callers don't all need updating
export const logEvent = (event, eventProps = {}) => {
  analytics.track(event, eventProps);
};

const AnalyticsProvider = () => {
  useEffect(() => {
    initializeAnalytics().then(() => {
      analytics.track("Analytics Initialized");
    });
  }, []);

  return null;
};

export default AnalyticsProvider;
