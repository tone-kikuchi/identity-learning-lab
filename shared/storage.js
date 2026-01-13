import { seedOidcDemo, seedSamlDemo } from './sample_data.js';

const MAX_LOGS = 200;
const DEMO_KEYS = new Set(['saml', 'oidc']);
const LAST_DEMO_KEY = 'mockidp.lastDemo';

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

export function getLastDemo(storage = window.localStorage) {
  if (!storage) {
    return null;
  }
  return normalizeDemo(storage.getItem(LAST_DEMO_KEY));
}

export function setLastDemo(demo, storage = window.localStorage) {
  const normalized = normalizeDemo(demo);
  if (!normalized || !storage) {
    return;
  }
  storage.setItem(LAST_DEMO_KEY, normalized);
}

export function resolveDemo({ demo = null, location = window.location, storage = window.localStorage } = {}) {
  const explicit = normalizeDemo(demo);
  if (explicit) {
    return explicit;
  }
  const fromLocation = getDemoFromLocation(location);
  if (fromLocation) {
    return fromLocation;
  }
  return getLastDemo(storage);
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
    return;
  }
  const normalizedApps = applyDefaultAppValues(normalized, apps);
  if (normalizedApps !== apps) {
    setJson(normalized, 'apps', normalizedApps);
  }
}

function applyDefaultAppValues(demo, apps) {
  if (!Array.isArray(apps)) {
    return apps;
  }
  const seed = demo === 'saml' ? seedSamlDemo() : seedOidcDemo();
  const defaults = seed.apps[0];
  let updated = false;
  const nextApps = apps.map((app) => {
    if (!app || app.mode !== defaults.mode) {
      return app;
    }
    const nextApp = {
      ...app,
      id: app.id || defaults.id,
      name: app.name || defaults.name
    };
    if (defaults.mode === 'saml_like') {
      nextApp.spEntityId = app.spEntityId || defaults.spEntityId;
      nextApp.acsUrl = app.acsUrl || defaults.acsUrl;
      nextApp.sharedSecret = app.sharedSecret || defaults.sharedSecret;
    } else {
      nextApp.clientId = app.clientId || defaults.clientId;
      nextApp.redirectUri = app.redirectUri || defaults.redirectUri;
    }
    if (JSON.stringify(nextApp) !== JSON.stringify(app)) {
      updated = true;
    }
    return nextApp;
  });
  return updated ? nextApps : apps;
}

export function appendLog(demo, event) {
  const existing = getJson(demo, 'eventLog', []);
  const next = [...existing, { at: new Date().toISOString(), ...event }];
  const trimmed = next.slice(-MAX_LOGS);
  setJson(demo, 'eventLog', trimmed);
}
