import { useEffect } from 'react';
import { init, track } from '@amplitude/analytics-node';
import { v4 as uuidv4 } from 'uuid';
import { waitForIndexedDB } from '../lib/idb';

const AMPLITUDE_API_KEY = 'Put your API key here';

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

};

export const logEvent = async (event, eventProps) => {
  await track(event, {
    ...eventProps,
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
