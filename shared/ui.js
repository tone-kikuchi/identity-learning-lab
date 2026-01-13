import { samlSteps } from './models.js';
import { appendLog, resetAll, getJson } from './storage.js';

export function renderHeader(activeRole = '') {
  const header = document.createElement('header');
  header.innerHTML = `
    <div class="header-inner">
      <div class="nav-links">
        <a href="/" class="${activeRole === 'home' ? 'active' : ''}">Home</a>
        <a href="/admin/" class="${activeRole === 'admin' ? 'active' : ''}">Admin</a>
        <a href="/idp/" class="${activeRole === 'idp' ? 'active' : ''}">IdP</a>
        <a href="/sp/" class="${activeRole === 'sp' ? 'active' : ''}">SP</a>
      </div>
      <button class="button secondary" id="resetButton">Reset</button>
    </div>
  `;
  header.querySelector('#resetButton').addEventListener('click', () => {
    resetAll();
    appendLog({ actor: 'system', action: 'reset', detail: 'localStorage reset' });
    window.location.reload();
  });
  document.body.prepend(header);
}

export function renderStepBar(flow, currentStepIndex) {
  const steps = flow === 'saml' ? samlSteps : [];
  const wrapper = document.createElement('div');
  wrapper.className = 'stepbar';
  steps.forEach((label, index) => {
    const step = document.createElement('div');
    step.className = `step ${index === currentStepIndex ? 'active' : ''}`;
    step.textContent = label;
    wrapper.appendChild(step);
  });
  return wrapper;
}

export function renderLearningPanel({
  purpose,
  params,
  generated,
  validation,
  storageSnapshot,
  logs
}) {
  const panel = document.createElement('div');
  panel.className = 'learning-panel';
  panel.innerHTML = `
    <details open>
      <summary>学習パネル（折りたたみ）</summary>
      <div class="section">
        <h3>このページの目的</h3>
        <p>${purpose || ''}</p>
      </div>
      <div class="section">
        <h3>入力パラメータ</h3>
        <pre>${formatJson(params)}</pre>
      </div>
      <div class="section">
        <h3>生成物</h3>
        <pre>${formatJson(generated)}</pre>
      </div>
      <div class="section">
        <h3>検証結果</h3>
        <div>${formatValidation(validation)}</div>
      </div>
      <div class="section">
        <h3>ストレージスナップショット</h3>
        <pre>${formatJson(storageSnapshot)}</pre>
      </div>
      <div class="section">
        <h3>イベントログ</h3>
        ${formatLogs(logs)}
      </div>
    </details>
  `;
  return panel;
}

function formatJson(value) {
  if (!value) {
    return '—';
  }
  return JSON.stringify(value, null, 2);
}

function formatValidation(validation = []) {
  if (!validation || validation.length === 0) {
    return '<span class="muted">—</span>';
  }
  return validation
    .map((item) => {
      const badge = item.ok ? 'success' : 'fail';
      const text = item.ok ? 'OK' : 'NG';
      return `
        <div>
          <span class="badge ${badge}">${text}</span>
          <strong>${item.name}</strong>
          <span class="muted">${item.detail || ''}</span>
        </div>
      `;
    })
    .join('');
}

function formatLogs(logs) {
  if (!logs || logs.length === 0) {
    return '<div class="muted">—</div>';
  }
  return `<div class="log-list">${logs
    .slice(-20)
    .map((log) => `${log.at} ${log.actor || ''} ${log.action || ''} ${log.detail || ''}`)
    .join('\n')}</div>`;
}

export function snapshotStorage() {
  return {
    apps: getJson('mockidp.apps', []),
    users: getJson('mockidp.users', []),
    idpSession: getJson('mockidp.idpSession', null),
    spSessions: getJson('mockidp.spSessions', {}),
    eventLog: getJson('mockidp.eventLog', [])
  };
}
