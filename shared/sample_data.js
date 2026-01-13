export function sampleApps() {
  return [
    {
      id: 'app_sample',
      name: 'Sample SAML App',
      mode: 'saml_like',
      spEntityId: 'sp.sample',
      acsUrl: '../sp/acs_receive.html',
      sharedSecret: 'dev-secret-change-me'
    },
    {
      id: 'app_oidc_demo',
      name: 'Sample OIDC App',
      mode: 'oidc_like',
      clientId: 'client_demo',
      redirectUri: '../sp/callback.html'
    }
  ];
}

export function sampleUsers() {
  return [
    {
      id: 'user_alice',
      username: 'alice@example.com',
      displayName: 'Alice',
      groups: ['engineering'],
      active: true
    },
    {
      id: 'user_bob',
      username: 'bob@example.com',
      displayName: 'Bob',
      groups: ['sales'],
      active: false
    }
  ];
}
