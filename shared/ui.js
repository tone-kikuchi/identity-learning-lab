import { samlSteps, oidcSteps } from './models.js';
import { appendLog, resetAll, getJson } from './storage.js';

export function renderHeader(activeRoleOrOptions = '', options = {}) {
  let activeRole = '';
  let basePath = '.';
  if (typeof activeRoleOrOptions === 'object' && activeRoleOrOptions !== null) {
    ({ activeRole = '', basePath = '.' } = activeRoleOrOptions);
  } else {
    activeRole = activeRoleOrOptions;
    basePath = options.basePath ?? '.';
  }
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const resolvedBasePath = normalizedBasePath || '.';
  const header = document.createElement('header');
  header.innerHTML = `
    <div class="header-inner">
      <div class="nav-links">
        <a href="${resolvedBasePath}/index.html" class="${activeRole === 'home' ? 'active' : ''}">Home</a>
        <a href="${resolvedBasePath}/guide.html" class="${activeRole === 'guide' ? 'active' : ''}">Guide</a>
        <a href="${resolvedBasePath}/admin/index.html" class="${activeRole === 'admin' ? 'active' : ''}">Admin</a>
        <a href="${resolvedBasePath}/idp/index.html" class="${activeRole === 'idp' ? 'active' : ''}">IdP</a>
        <a href="${resolvedBasePath}/sp/index.html" class="${activeRole === 'sp' ? 'active' : ''}">SP</a>
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
  const steps = flow === 'saml' ? samlSteps : flow === 'oidc' ? oidcSteps : [];
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
        <div>${formatParameterGuide(params)}</div>
      </div>
      <div class="section">
        <h3>生成物</h3>
        <pre>${formatJson(generated)}</pre>
        <div>${formatParameterGuide(generated)}</div>
      </div>
      <div class="section">
        <h3>検証結果</h3>
        <div>${formatValidation(validation)}</div>
        <div>${formatValidationGuide(validation)}</div>
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

const PARAMETER_DESCRIPTIONS = {
  appId: 'Adminで設定したアプリID。',
  acs: 'SP側のACS(Assertion Consumer Service) URL。レスポンス送信先。',
  spEntityId: 'SPのエンティティID。audience検証の対象。',
  requestId: 'SPが発行したリクエストID。inResponseToで一致確認する。',
  relayState: 'リクエストとレスポンスで引き回す状態値。',
  SAMLResponse: 'IdPが生成したSAMLResponse相当のBase64文字列。',
  RelayState: 'SAMLResponseに付随して返す状態値。',
  expected: 'SP側で保存した期待値。',
  received: 'ACSで受信したPOST内容。',
  'expected.requestId': '期待しているリクエストID。',
  'expected.relayState': '送信時に保存したRelayState。',
  'expected.receivedRelayState': '受信したRelayState。',
  'received.SAMLResponse': '受信したSAMLResponse(Base64)。',
  'received.RelayState': '受信したRelayState。',
  'received.appId': '受信したアプリID。',
  iss: '発行者(issuer)の識別子。ここではIdPを示す。',
  aud: 'Audience(宛先SP)の識別子。',
  recipient: 'レスポンスの送信先(ACS URL)。',
  inResponseTo: '対応するAuthnRequestのID。',
  iat: '発行時刻(UNIX秒)。',
  exp: '有効期限(UNIX秒)。現在時刻より後かを確認。',
  subject: 'ユーザ属性の集合。',
  'subject.userId': 'ユーザID。',
  'subject.username': 'ログイン名。',
  'subject.displayName': '表示名。',
  'subject.groups': '所属グループ。',
  sig: 'HMAC署名。改ざん検知のために検証する。',
  user: 'IdPでログイン済みのユーザ情報。',
  'user.id': 'ユーザID。',
  'user.username': 'ログイン名。',
  'user.displayName': '表示名。',
  'user.groups': '所属グループ。'
};

const VALIDATION_DESCRIPTIONS = {
  'SAMLResponse present': 'SAMLResponseが送信されているかを確認。',
  'SAMLResponse decode': 'Base64デコードとJSONパースに成功するかを確認。',
  RelayState一致: '送信時に保存したRelayStateと受信値が一致するかを確認。',
  inResponseTo一致: 'レスポンスが想定リクエストIDに紐づくかを確認。',
  aud一致: 'AudienceがSPのエンティティIDと一致するかを確認。',
  recipient一致: 'レスポンス送信先(ACS URL)が一致するかを確認。',
  exp未期限切れ: '有効期限(exp)が現在時刻より後かを確認。',
  sig検証: '共有シークレットで署名(HMAC)が一致するかを確認。'
};

function formatJson(value) {
  if (!value) {
    return '—';
  }
  return JSON.stringify(value, null, 2);
}

function formatParameterGuide(values) {
  const entries = flattenKeys(values);
  if (entries.length === 0) {
    return '<span class="muted">—</span>';
  }
  const unique = Array.from(new Set(entries));
  return `
    <dl class="definition-list">
      ${unique
        .map((path) => {
          const description = PARAMETER_DESCRIPTIONS[path] || PARAMETER_DESCRIPTIONS[path.split('.').pop()];
          return `
            <div>
              <dt>${path}</dt>
              <dd>${description || '説明未登録'}</dd>
            </div>
          `;
        })
        .join('')}
    </dl>
  `;
}

function formatValidationGuide(validation = []) {
  if (!validation || validation.length === 0) {
    return '<span class="muted">—</span>';
  }
  const unique = Array.from(new Set(validation.map((item) => item.name)));
  return `
    <dl class="definition-list">
      ${unique
        .map((name) => {
          const description = VALIDATION_DESCRIPTIONS[name];
          return `
            <div>
              <dt>${name}</dt>
              <dd>${description || '説明未登録'}</dd>
            </div>
          `;
        })
        .join('')}
    </dl>
  `;
}

function flattenKeys(value, prefix = '') {
  if (!value || typeof value !== 'object') {
    return [];
  }
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return [path, ...flattenKeys(item, path)];
    }
    return [path];
  });
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
