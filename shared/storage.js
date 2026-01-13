import { seedOidcDemo, seedSamlDemo } from './sample_data.js';

const MAX_LOGS = 200;
const DEMO_KEYS = new Set(['saml', 'oidc']);

export function normalizeDemo(demo) {
  if (!demo) {
    return null;
  }
  const value = String(demo).toLowerCase();
  return DEMO_KEYS.has(value) ? value : null;
}

export function getDemoFromLocation(location = window.location) {
  const params = new URLSearchParams(location.search);
  return normalizeDemo(params.get('demo'));
}

export function makeKey(demo, key) {
  const normalized = normalizeDemo(demo);
  if (!normalized) {
    return null;
  }
  return `mockidp.${normalized}.${key}`;
}

function getStorageKey(demo, key) {
  return makeKey(demo, key);
}

export function getJson(demo, key, fallback = null) {
  const storageKey = getStorageKey(demo, key);
  if (!storageKey) {
    return fallback;
  }
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse JSON', storageKey, error);
    return fallback;
  }
}

export function setJson(demo, key, value) {
  const storageKey = getStorageKey(demo, key);
  if (!storageKey) {
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify(value));
}

export function getSessionJson(demo, key, fallback = null) {
  const storageKey = getStorageKey(demo, key);
  if (!storageKey) {
    return fallback;
  }
  const raw = sessionStorage.getItem(storageKey);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse session JSON', storageKey, error);
    return fallback;
  }
}

export function setSessionJson(demo, key, value) {
  const storageKey = getStorageKey(demo, key);
  if (!storageKey) {
    return;
  }
  sessionStorage.setItem(storageKey, JSON.stringify(value));
}

export function resetDemo(demo) {
  const normalized = normalizeDemo(demo);
  if (!normalized) {
    return;
  }
  const seed = normalized === 'saml' ? seedSamlDemo() : seedOidcDemo();
  setJson(normalized, 'apps', seed.apps);
  setJson(normalized, 'users', seed.users);
  setJson(normalized, 'idpSession', null);
  setJson(normalized, 'spSessions', {});
  setJson(normalized, 'eventLog', []);
}

export function ensureDemoSeed(demo) {
  const normalized = normalizeDemo(demo);
  if (!normalized) {
    return;
  }
  const apps = getJson(normalized, 'apps');
  const users = getJson(normalized, 'users');
  const hasApps = Array.isArray(apps) && apps.length > 0;
  const hasUsers = Array.isArray(users) && users.length > 0;
  if (!hasApps || !hasUsers) {
    resetDemo(normalized);
  }
}

export function appendLog(demo, event) {
  const existing = getJson(demo, 'eventLog', []);
  const next = [...existing, { at: new Date().toISOString(), ...event }];
  const trimmed = next.slice(-MAX_LOGS);
  setJson(demo, 'eventLog', trimmed);
}
