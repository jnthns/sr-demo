import { useEffect } from 'react';
import { init, track } from '@amplitude/analytics-node';
import { v4 as uuidv4 } from 'uuid';
import { waitForIndexedDB } from '../lib/idb';

const AMPLITUDE_API_KEY = 'd8d47f31b5c3de8852229cf96b91769d';

const uuid = uuidv4();
const sessionId = Date.now();

console.log("Device ID is: " + uuid);
console.log("Session ID is: " + sessionId);

const initializeAmplitude = async () => {
  await waitForIndexedDB();

  init(AMPLITUDE_API_KEY, {
    flushIntervalMillis: 500,
    flushQueueSize: 1
  });

  // add Session Replay Init here
  // below init, set the Session ID for Session Replay
};

export const logEvent = async (event, eventProps) => {
  await waitForIndexedDB();
  // add sessionReplayProperties here

  await track(event, {
    ...eventProps,
    // add ...sessionReplayProperties here
  }, {
    user_id: "Session Replay SDK Demo",
    device_id: uuid,
    session_id: sessionId
  });
};

const Amplitude = () => {
  useEffect(() => {
    initializeAmplitude();
  }, []);

  return null;
};

export default Amplitude;
