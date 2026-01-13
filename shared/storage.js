import { sampleApps, sampleUsers } from './sample_data.js';

const MAX_LOGS = 200;

export function getJson(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse JSON', key, error);
    return fallback;
  }
}

export function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function resetAll() {
  setJson('mockidp.apps', sampleApps());
  setJson('mockidp.users', sampleUsers());
  setJson('mockidp.idpSession', null);
  setJson('mockidp.spSessions', {});
  setJson('mockidp.eventLog', []);
}

export function appendLog(event) {
  const existing = getJson('mockidp.eventLog', []);
  const next = [...existing, { at: new Date().toISOString(), ...event }];
  const trimmed = next.slice(-MAX_LOGS);
  setJson('mockidp.eventLog', trimmed);
}
