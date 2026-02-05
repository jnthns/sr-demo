'use client'

import { useState } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { deviceId as defaultDeviceId } from '../../lib/amplitude';

const DEFAULT_API_KEY = 'a1e47468f1a2a0f73ee870f492893abb';

const getRandomId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `user_${Math.random().toString(36).slice(2, 10)}`;
};

const parseJsonField = (value) => {
  if (!value.trim()) {
    return { data: {}, error: null };
  }
  try {
    return { data: JSON.parse(value), error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

const formatIso = (timestampMs) => new Date(timestampMs).toISOString();

export default function AmplitudeApiTesterPage() {
  const [userId, setUserId] = useState('demo-user');
  const [deviceId, setDeviceId] = useState(defaultDeviceId || '');
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);

  const [identifyPropsJson, setIdentifyPropsJson] = useState('{"plan":"free"}');
  const [groupType, setGroupType] = useState('org');
  const [groupName, setGroupName] = useState('acme');
  const [groupPropsJson, setGroupPropsJson] = useState('{"tier":"enterprise"}');

  const [httpEventType, setHttpEventType] = useState('http_event_test');
  const [httpEventPropsJson, setHttpEventPropsJson] = useState('{"source":"amplitude-api-tester"}');

  const [batchEventType, setBatchEventType] = useState('batch_event_test');
  const [batchEventPropsJson, setBatchEventPropsJson] = useState('{"batch":true}');

  const [status, setStatus] = useState({
    identify: null,
    groupIdentify: null,
    http: null,
    batch: null
  });

  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());

  const setStatusMessage = (key, nextStatus) => {
    setStatus((prev) => ({
      ...prev,
      [key]: nextStatus
    }));
  };

  const ensureIds = () => {
    if (!userId.trim()) {
      const generated = getRandomId();
      setUserId(generated);
      return generated;
    }
    return userId.trim();
  };

  const handleIdentify = async () => {
    const resolvedUserId = ensureIds();
    const { data, error } = parseJsonField(identifyPropsJson);
    if (error) {
      setStatusMessage('identify', { ok: false, message: `Invalid JSON: ${error}` });
      return;
    }

    const identifyObj = new amplitude.Identify();
    Object.entries(data).forEach(([key, value]) => {
      identifyObj.set(key, value);
    });

    const time = Date.now();
    amplitude.setUserId(resolvedUserId);
    if (deviceId) {
      amplitude.setDeviceId(deviceId);
    }

    try {
      await amplitude.identify(identifyObj, { time });
      setCurrentTimeMs(time);
      setStatusMessage('identify', {
        ok: true,
        message: `Identify sent at ${formatIso(time)}`
      });
    } catch (error) {
      setStatusMessage('identify', { ok: false, message: error.message });
    }
  };

  const handleGroupIdentify = async () => {
    const resolvedUserId = ensureIds();
    const { data, error } = parseJsonField(groupPropsJson);
    if (error) {
      setStatusMessage('groupIdentify', { ok: false, message: `Invalid JSON: ${error}` });
      return;
    }
    if (!groupType.trim() || !groupName.trim()) {
      setStatusMessage('groupIdentify', { ok: false, message: 'Group type and name are required.' });
      return;
    }

    const identifyObj = new amplitude.Identify();
    Object.entries(data).forEach(([key, value]) => {
      identifyObj.set(key, value);
    });

    const time = Date.now();
    amplitude.setUserId(resolvedUserId);
    if (deviceId) {
      amplitude.setDeviceId(deviceId);
    }

    try {
      await amplitude.groupIdentify(groupType.trim(), groupName.trim(), identifyObj, { time });
      setCurrentTimeMs(time);
      setStatusMessage('groupIdentify', {
        ok: true,
        message: `Group Identify sent at ${formatIso(time)}`
      });
    } catch (error) {
      setStatusMessage('groupIdentify', { ok: false, message: error.message });
    }
  };

  const handleHttpApi = async () => {
    const resolvedUserId = ensureIds();
    const { data, error } = parseJsonField(httpEventPropsJson);
    if (error) {
      setStatusMessage('http', { ok: false, message: `Invalid JSON: ${error}` });
      return;
    }

    const time = Date.now();
    const payload = {
      api_key: apiKey.trim() || DEFAULT_API_KEY,
      events: [
        {
          user_id: resolvedUserId,
          device_id: deviceId || undefined,
          event_type: httpEventType.trim() || 'http_event_test',
          event_properties: data,
          time
        }
      ]
    };

    try {
      const response = await fetch('https://api2.amplitude.com/2/httpapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      setCurrentTimeMs(time);
      setStatusMessage('http', {
        ok: response.ok,
        message: `HTTP API responded ${response.status}: ${text || 'OK'}`
      });
    } catch (error) {
      setStatusMessage('http', { ok: false, message: error.message });
    }
  };

  const handleBatchApi = async () => {
    const resolvedUserId = ensureIds();
    const { data, error } = parseJsonField(batchEventPropsJson);
    if (error) {
      setStatusMessage('batch', { ok: false, message: `Invalid JSON: ${error}` });
      return;
    }

    const time = Date.now();
    const payload = {
      api_key: apiKey.trim() || DEFAULT_API_KEY,
      events: [
        {
          user_id: resolvedUserId,
          device_id: deviceId || undefined,
          event_type: batchEventType.trim() || 'batch_event_test',
          event_properties: data,
          time
        }
      ]
    };

    try {
      const response = await fetch('https://api2.amplitude.com/2/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      setCurrentTimeMs(time);
      setStatusMessage('batch', {
        ok: response.ok,
        message: `Batch API responded ${response.status}: ${text || 'OK'}`
      });
    } catch (error) {
      setStatusMessage('batch', { ok: false, message: error.message });
    }
  };

  const renderStatus = (entry) => {
    if (!entry) return null;
    const styles = entry.ok
      ? 'border-green-300 bg-green-50 text-green-800'
      : 'border-red-300 bg-red-50 text-red-800';
    return (
      <div className={`mt-3 rounded-md border p-3 text-sm whitespace-pre-wrap break-words ${styles}`}>
        {entry.message}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-semibold mb-2">Amplitude API Tester</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Send Identify, Group Identify, HTTP, and Batch requests. The time field is always set
            to the current datetime when the request is sent.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Shared Context</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user-id" className="block text-sm font-medium mb-1">
                User ID
              </label>
              <div className="flex gap-2">
                <input
                  id="user-id"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700"
                  placeholder="Enter a user id"
                />
                <button
                  type="button"
                  onClick={() => setUserId(getRandomId())}
                  className="whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-md transition"
                >
                  Random ID
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="device-id" className="block text-sm font-medium mb-1">
                Device ID
              </label>
              <div className="flex gap-2">
                <input
                  id="device-id"
                  value={deviceId}
                  onChange={(event) => setDeviceId(event.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700"
                  placeholder="Enter a device id"
                />
                <button
                  type="button"
                  onClick={() => setDeviceId(getRandomId())}
                  className="whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-md transition"
                >
                  Random ID
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="api-key" className="block text-sm font-medium mb-1">
                API Key (HTTP/Batch)
              </label>
              <input
                id="api-key"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700"
                placeholder="Amplitude API key"
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium mb-1">
                Current Time
              </label>
              <input
                id="time"
                value={`${formatIso(currentTimeMs)} (auto-updated on send)`}
                readOnly
                className="w-full rounded-md border border-gray-200 dark:border-zinc-700 p-2 text-sm bg-gray-100 dark:bg-zinc-700"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Identify</h2>
            <label htmlFor="identify-props" className="block text-sm font-medium mb-1">
              User Properties (JSON)
            </label>
            <textarea
              id="identify-props"
              value={identifyPropsJson}
              onChange={(event) => setIdentifyPropsJson(event.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700 min-h-[120px]"
            />
            <button
              type="button"
              onClick={handleIdentify}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition"
            >
              Send Identify
            </button>
            {renderStatus(status.identify)}
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Group Identify</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="group-type" className="block text-sm font-medium mb-1">
                  Group Type
                </label>
                <input
                  id="group-type"
                  value={groupType}
                  onChange={(event) => setGroupType(event.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700"
                />
              </div>
              <div>
                <label htmlFor="group-name" className="block text-sm font-medium mb-1">
                  Group Name
                </label>
                <input
                  id="group-name"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700"
                />
              </div>
            </div>
            <label htmlFor="group-props" className="block text-sm font-medium mb-1">
              Group Properties (JSON)
            </label>
            <textarea
              id="group-props"
              value={groupPropsJson}
              onChange={(event) => setGroupPropsJson(event.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700 min-h-[120px]"
            />
            <button
              type="button"
              onClick={handleGroupIdentify}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition"
            >
              Send Group Identify
            </button>
            {renderStatus(status.groupIdentify)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">HTTP API</h2>
            <label htmlFor="http-event-type" className="block text-sm font-medium mb-1">
              Event Type
            </label>
            <input
              id="http-event-type"
              value={httpEventType}
              onChange={(event) => setHttpEventType(event.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700 mb-4"
            />
            <label htmlFor="http-event-props" className="block text-sm font-medium mb-1">
              Event Properties (JSON)
            </label>
            <textarea
              id="http-event-props"
              value={httpEventPropsJson}
              onChange={(event) => setHttpEventPropsJson(event.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700 min-h-[120px]"
            />
            <button
              type="button"
              onClick={handleHttpApi}
              className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md transition"
            >
              Send HTTP API Event
            </button>
            {renderStatus(status.http)}
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Batch API</h2>
            <label htmlFor="batch-event-type" className="block text-sm font-medium mb-1">
              Event Type
            </label>
            <input
              id="batch-event-type"
              value={batchEventType}
              onChange={(event) => setBatchEventType(event.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700 mb-4"
            />
            <label htmlFor="batch-event-props" className="block text-sm font-medium mb-1">
              Event Properties (JSON)
            </label>
            <textarea
              id="batch-event-props"
              value={batchEventPropsJson}
              onChange={(event) => setBatchEventPropsJson(event.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-zinc-600 p-2 text-sm dark:bg-zinc-700 min-h-[120px]"
            />
            <button
              type="button"
              onClick={handleBatchApi}
              className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md transition"
            >
              Send Batch API Event
            </button>
            {renderStatus(status.batch)}
          </div>
        </div>
      </div>
    </div>
  );
}
