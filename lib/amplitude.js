import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { waitForIndexedDB } from '../lib/idb';

const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
const BATCH_API_URL = 'https://api2.amplitude.com/batch';

let hasInitializedAnalytics = false;

const userId = 'sr-demo-user';

/** Single source of truth for device id; use `user.device_id` everywhere below. */
const user = {
  // user_id: userId,
  device_id: uuidv4(),
  user_properties: {},
};

/** Backward-compatible alias — same value as `user.device_id`. */
export const deviceId = user.device_id;

export const sessionId = Date.now();
export const flag = 'test';

export let experimentInstance = null;
let experimentReadyResolve;
export const experimentReady = new Promise((resolve) => {
  experimentReadyResolve = resolve;
});

console.log('Device ID is: ' + user.device_id);
console.log('Session ID is: ' + sessionId);

// --- Batch API ---

export const logEvent = (eventType, eventProperties = {}) => {
  if (typeof window === 'undefined') return;

  const payload = {
    api_key: AMPLITUDE_API_KEY,
    events: [
      {
        event_type: eventType,
        event_properties: {
          ...eventProperties,
          url: window.location.href,
        },
        // user_id: user.user_id,
        device_id: user.device_id,
        session_id: sessionId,
        time: Date.now(),
        platform: 'Web',
        os_name: navigator.userAgentData?.platform ?? navigator.platform ?? 'Web',
        language: navigator.language,
      },
    ],
  };

  fetch(BATCH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: '*/*' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((err) => console.warn('[amp] Batch API send failed:', err));
};

// --- Init ---

const initializeAnalytics = async () => {
  console.log('[amp] initializeAnalytics called, hasInit:', hasInitializedAnalytics);
  if (hasInitializedAnalytics || typeof window === 'undefined') {
    return;
  }
  hasInitializedAnalytics = true;

  await waitForIndexedDB();

  console.group('[amp] SDK ready — identity snapshot');
  // console.log('user_id:   ', userId);
  console.log('device_id: ', user.deviceId);
  console.log('session_id:', sessionId);
  fetch('https://api.ipify.org?format=json')
    .then((r) => r.json())
    .then(({ ip }) => console.log('client ip (ipify):', ip))
    .catch(() => {});
  console.groupEnd();

  // --- Session Replay standalone SDK ---
  try {
    const sessionReplay = await import('@amplitude/session-replay-browser');
    await sessionReplay.init(AMPLITUDE_API_KEY, {
      deviceId: user.device_id,
      sessionId,
      sampleRate: 1,
      optOut: false,
    }).promise;
    console.log('[amp] Session Replay standalone SDK initialized');
  } catch (err) {
    console.warn('Session Replay standalone SDK failed to load:', err);
  }

  // --- Experiment SDK ---
  try {
    const { Experiment } = await import('@amplitude/experiment-js-client');
    experimentInstance = Experiment.initialize(AMPLITUDE_API_KEY);
  } catch (err) {
    console.warn('Experiment SDK failed to load:', err);
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
    console.log('Variant value is: ' + variantValue);

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
        ...customUserProperties,
      },
    };

    await experimentInstance.fetch(userWithCustomProps);
    const variant = experimentInstance.variant(flag);
    const variantValue = variant.value;

    console.log('Variant value with custom properties:', variantValue);
    console.log('User properties used:', userWithCustomProps.user_properties);

    return {
      success: true,
      variant: variantValue,
      userProperties: userWithCustomProps.user_properties,
      metadata: variant.metadata || {},
    };
  } catch (err) {
    console.error('Variant fetch failed', err);
    return {
      success: false,
      error: err.message,
      variant: null,
      userProperties: customUserProperties,
    };
  }
}

const AnalyticsProvider = () => {
  useEffect(() => {
    initializeAnalytics().then(() => {
      logEvent('Analytics Initialized');
    });
  }, []);

  return null;
};

export default AnalyticsProvider;
