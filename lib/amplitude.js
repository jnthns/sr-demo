import { useEffect } from 'react';
import { init, track } from '@amplitude/analytics-node';
import { v4 as uuidv4 } from 'uuid';
import { waitForIndexedDB } from '../lib/idb';

const AMPLITUDE_API_KEY = 'ab46a20bff78e0e81465cdaf05ab4e17';

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

  // add Session Replay Init block here
  // set the Session ID for Session Replay
};

export const logEvent = async (event, eventProps) => {
  await waitForIndexedDB();
  // add sessionReplayProperties here

  await track(event, {
    ...eventProps,
    // add ...sessionReplayProperties here
  }, {
    user_id: "Your Name",
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
