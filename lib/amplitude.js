import { useEffect } from 'react';
// import { init, track } from '@amplitude/analytics-node';
import * as amplitude from "@amplitude/analytics-browser";
import * as sessionReplay from "@amplitude/session-replay-browser";
import { v4 as uuidv4 } from 'uuid';
import { waitForIndexedDB } from '../lib/idb';

const AMPLITUDE_API_KEY = 'a1e47468f1a2a0f73ee870f492893abb' 

const uuid = uuidv4();
const sessionId = Date.now();

console.log("Device ID is: " + uuid);
console.log("Session ID is: " + sessionId);

const initializeAmplitude = async () => {
  await waitForIndexedDB();

  amplitude.init(AMPLITUDE_API_KEY, {
    flushIntervalMillis: 500,
    flushQueueSize: 1,
    autocapture: {
      pageViews: true,
      elementInteractions: true
    }
  });

  await sessionReplay.init(AMPLITUDE_API_KEY, {
    deviceId: uuid, // replace "<string>" with uuid (no quotes)
    sessionId: sessionId, // replace "<number>" with sessionId (no quotes)
    optOut: false, // we want to see our events, so set this to false (no quotes)
    sampleRate: 1 // set this to 1, which represents 100% which is ok for testing but not for prod
   }).promise;

   // quota: 1 million
   // average monthly sessions of 3m
   // 1/3, or a sample rate of .33
   // .25 -> .33
   sessionReplay.setSessionId(sessionId);

};

export const logEvent = async (event, eventProps) => {
  await waitForIndexedDB();
  const sessionReplayProperties = sessionReplay.getSessionReplayProperties();

  await track(event, {
    ...eventProps,
    ...sessionReplayProperties
  }, {
    user_id: null,
    device_id: uuid,
    session_id: sessionId,
  });
};

const Amplitude = () => {
  useEffect(() => {
    initializeAmplitude();
  }, []);

  return null;
};

export default Amplitude;
