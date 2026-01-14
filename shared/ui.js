import { samlSteps, oidcSteps } from './models.js';
import { appendLog, resetDemo, getJson, getDemoFromLocation, resolveDemo, setLastDemo } from './storage.js';

export function buildUrl(path, { basePath = '.', demo } = {}) {
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const resolvedBasePath = normalizedBasePath.replace(/^\//, '') || '.';
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${resolvedBasePath}/${normalizedPath}`;
  if (!demo) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}demo=${encodeURIComponent(demo)}`;
}

export function applyDemoLinks(demo, { basePath = '.' } = {}) {
  const resolvedDemo = resolveDemo({ demo });
  if (!resolvedDemo) {
    return;
  }
  document.querySelectorAll('[data-demo-path]').forEach((anchor) => {
    const path = anchor.dataset.demoPath;
    if (!path) {
      return;
    }
    anchor.setAttribute('href', buildUrl(path, { basePath, demo: resolvedDemo }));
  });
}

export function renderHeader(activeRoleOrOptions = '', options = {}) {
  let activeRole = '';
  let basePath = '.';
  let demo = null;
  if (typeof activeRoleOrOptions === 'object' && activeRoleOrOptions !== null) {
    ({ activeRole = '', basePath = '.', demo = null } = activeRoleOrOptions);
  } else {
    activeRole = activeRoleOrOptions;
    basePath = options.basePath ?? '.';
    demo = options.demo ?? null;
  }
  const resolvedDemo = resolveDemo({ demo });
  if (resolvedDemo) {
    setLastDemo(resolvedDemo);
  }
  const header = document.createElement('header');
  const demoLabel = resolvedDemo ? `Demo: ${resolvedDemo.toUpperCase()}` : 'Demo: 未選択';
  header.innerHTML = `
    <div class="header-inner">
      <div class="nav-links">
        <a href="${buildUrl('index.html', { basePath })}" class="${activeRole === 'guide' ? 'active' : ''}">Guide</a>
        <a href="${buildUrl('saml.html', { basePath })}" class="${activeRole === 'saml' ? 'active' : ''}">SAML Demo</a>
        <a href="${buildUrl('oidc.html', { basePath })}" class="${activeRole === 'oidc' ? 'active' : ''}">OIDC Demo</a>
        <a href="${buildUrl('admin/index.html', { basePath, demo: resolvedDemo })}" class="${activeRole === 'admin' ? 'active' : ''}">Admin</a>
        <a href="${buildUrl('idp/index.html', { basePath, demo: resolvedDemo })}" class="${activeRole === 'idp' ? 'active' : ''}">IdP</a>
        <a href="${buildUrl('sp/index.html', { basePath, demo: resolvedDemo })}" class="${activeRole === 'sp' ? 'active' : ''}">SP</a>
      </div>
      <div class="header-actions">
        <span class="demo-label ${resolvedDemo ? '' : 'muted'}">${demoLabel}</span>
        ${resolvedDemo ? '<button class="button secondary" id="resetButton">Reset</button>' : ''}
      </div>
    </div>
  `;
  const resetButton = header.querySelector('#resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      resetDemo(resolvedDemo);
      appendLog(resolvedDemo, { actor: 'system', action: 'reset', detail: 'demo storage reset' });
      window.location.reload();
    });
  }
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

export function getUserProfilePresentation(session = {}) {
  const safeSession = session ?? {};
  const groups = Array.isArray(safeSession.groups) ? safeSession.groups : [];
  const displayName = safeSession.displayName ||
    safeSession.name ||
    safeSession.username ||
    safeSession.email ||
    safeSession.sub ||
    safeSession.userId ||
    'ログインユーザー';
  const handle = safeSession.username || safeSession.email || safeSession.sub || safeSession.userId || '';
  const icon = selectUserIcon({ groups, displayName, handle });
  return {
    displayName,
    handle,
    groups,
    icon
  };
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
  'user.groups': '所属グループ。',
  samlAppId: 'SAML-likeアプリを指すID。',
  oidcAppId: 'OIDC-likeアプリを指すID。',
  samlSession: 'SAML-likeのログイン済みセッション。',
  oidcSession: 'OIDC-likeのログイン済みセッション。',
  id: '識別子。',
  name: '名称（アプリ名やユーザー名など）。',
  mode: 'アプリの動作モード。',
  acsUrl: 'SAMLのACS(Recipient)として使うURL。',
  sharedSecret: 'SAMLレスポンス署名に使う共有鍵。',
  clientId: 'OIDCクライアントの識別子。',
  redirectUri: 'OIDCで戻り先として許可するURI。',
  response_type: 'OIDCのレスポンスタイプ（codeなど）。',
  scope: 'OIDCのスコープ指定。',
  client_id: 'OIDCクライアントID（リクエスト値）。',
  redirect_uri: 'OIDCのredirect_uriパラメータ。',
  state: 'CSRF対策のstateパラメータ。',
  nonce: 'ID Tokenのリプレイ対策用nonce。',
  code: 'OIDCの認可コード。',
  app: '対象アプリの設定情報。',
  'app.id': 'アプリの識別子。',
  'app.name': 'アプリ名。',
  'app.mode': 'アプリの動作モード。',
  'app.spEntityId': 'SAML用のSP Entity ID。',
  'app.acsUrl': 'SAML用のACS URL。',
  'app.sharedSecret': 'SAML用共有シークレット。',
  'app.clientId': 'OIDC用のClient ID。',
  'app.redirectUri': 'OIDC用のRedirect URI。',
  samlApp: 'SAML-likeのアプリ設定。',
  oidcApp: 'OIDC-likeのアプリ設定。',
  returnTo: 'ログイン後に戻る先のURL。',
  selectedUserId: 'IdPで選択されたユーザーID。',
  createdAt: '値を生成した時刻。',
  loginAt: 'ログインが成立した時刻。',
  sub: 'ユーザー識別子(sub)。',
  email: 'ユーザーのメールアドレス。',
  userId: 'ユーザー識別子。',
  username: 'ログイン名。',
  displayName: '表示名。',
  groups: '所属グループ。',
  idToken: 'OIDC-likeで発行したID Token。',
  'idToken.iss': 'ID Tokenの発行者。',
  'idToken.aud': 'ID TokenのAudience。',
  'idToken.iat': 'ID Tokenの発行時刻。',
  'idToken.exp': 'ID Tokenの有効期限。',
  'idToken.nonce': 'ID Tokenのnonce。',
  'idToken.sub': 'ID Tokenのsubject。',
  'idToken.email': 'ID Tokenに含まれるメールアドレス。',
  'idToken.name': 'ID Tokenに含まれる表示名。',
  'idToken.groups': 'ID Tokenに含まれるグループ情報。',
  'received.code': 'redirectで返ってきた認可コード。',
  'received.state': 'redirectで返ってきたstate。',
  'received.appId': 'redirectで返ってきたアプリID。',
  'expected.state': '送信時に保存したstate。',
  'expected.nonce': '送信時に保存したnonce。',
  'expected.appId': '送信時に保存したアプリID。',
  'expected.createdAt': 'state/nonceを保存した時刻。'
};

const VALIDATION_DESCRIPTIONS = {
  'SAMLResponse present': 'SAMLResponseが送信されているかを確認。',
  'SAMLResponse decode': 'Base64デコードとJSONパースに成功するかを確認。',
  RelayState一致: '送信時に保存したRelayStateと受信値が一致するかを確認。',
  inResponseTo一致: 'レスポンスが想定リクエストIDに紐づくかを確認。',
  aud一致: 'AudienceがSPのエンティティIDと一致するかを確認。',
  recipient一致: 'レスポンス送信先(ACS URL)が一致するかを確認。',
  exp未期限切れ: '有効期限(exp)が現在時刻より後かを確認。',
  sig検証: '共有シークレットで署名(HMAC)が一致するかを確認。',
  OIDCアプリ存在: 'OIDCアプリ設定が存在するかを確認。',
  client_id一致: 'client_idがアプリ設定と一致するかを確認。',
  redirect_uri一致: 'redirect_uriが登録値と一致するかを確認。',
  'response_type=code': 'response_typeがcodeかを確認。',
  'scope=openid': 'scopeにopenidが含まれるかを確認。',
  state一致: 'stateが保存値と一致するかを確認。',
  code存在: '認可コードが存在するかを確認。',
  code未使用: '認可コードが未使用かを確認。',
  code期限内: '認可コードの有効期限内かを確認。',
  nonce一致: 'nonceが保存値と一致するかを確認。'
};

function selectUserIcon({ groups = [], displayName = '', handle = '' } = {}) {
  const normalizedGroups = Array.isArray(groups) ? groups.map((group) => group.toLowerCase()) : [];
  if (normalizedGroups.includes('engineering')) {
    return '🛠️';
  }
  if (normalizedGroups.includes('sales')) {
    return '📈';
  }
  if (normalizedGroups.includes('security')) {
    return '🛡️';
  }
  if (normalizedGroups.includes('design')) {
    return '🎨';
  }
  if (normalizedGroups.includes('marketing')) {
    return '💬';
  }
  const combined = `${displayName} ${handle}`.toLowerCase();
  if (combined.includes('alice')) {
    return '🧑‍💻';
  }
  if (combined.includes('bob')) {
    return '🧑‍💼';
  }
  return '👤';
}

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

export function snapshotStorage(demo = null) {
  const resolvedDemo = demo ?? getDemoFromLocation();
  return {
    apps: getJson(resolvedDemo, 'apps', []),
    users: getJson(resolvedDemo, 'users', []),
    idpSession: getJson(resolvedDemo, 'idpSession', null),
    spSessions: getJson(resolvedDemo, 'spSessions', {}),
    eventLog: getJson(resolvedDemo, 'eventLog', [])
  };
}

export function renderDemoChooser({ basePath = '.' } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'card stack';
  wrapper.innerHTML = `
    <h2>デモを選択してください</h2>
    <p class="muted">SAML-like または OIDC-like のデモを選び、学習を開始します。</p>
    <div class="stack">
      <a class="button" href="${buildUrl('saml.html', { basePath })}">SAML-like デモへ</a>
      <a class="button secondary" href="${buildUrl('oidc.html', { basePath })}">OIDC-like デモへ</a>
    </div>
  `;
  return wrapper;
}

export function requireDemo({ basePath = '.', demo = null } = {}) {
  const resolvedDemo = resolveDemo({ demo });
  const demoFromLocation = getDemoFromLocation();
  if (resolvedDemo && !demoFromLocation) {
    const params = new URLSearchParams(window.location.search);
    params.set('demo', resolvedDemo);
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.location.replace(nextUrl);
    return null;
  }
  if (!resolvedDemo) {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = '';
      main.appendChild(renderDemoChooser({ basePath }));
    }
    return null;
  }
  setLastDemo(resolvedDemo);
  return resolvedDemo;
}
