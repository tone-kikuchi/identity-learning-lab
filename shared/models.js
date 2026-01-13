export const samlSteps = [
  'SP: Login開始',
  'IdP: AuthnRequest受信',
  'IdP: ユーザー認証',
  'IdP: アサーション生成',
  'SP: ACS受信/検証',
  'SP: セッション作成'
];

export const oidcSteps = [
  'SP: Login開始',
  'IdP: /authorize受信',
  'IdP: ユーザー認証',
  'IdP: code発行',
  'SP: callback受信/検証',
  'SP: セッション作成'
];
