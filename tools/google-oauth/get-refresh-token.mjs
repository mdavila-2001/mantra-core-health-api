#!/usr/bin/env node
// =============================================================================
// Obtiene un refresh_token de Gmail (OAuth2, cuenta normal sin Workspace) UNA
// sola vez, con consentimiento interactivo en el navegador. El refresh_token
// resultante se guarda en GOOGLE_OAUTH_REFRESH_TOKEN y GoogleEmailClient lo
// usa para siempre (no hay que repetir este paso salvo que se revoque el
// acceso desde https://myaccount.google.com/permissions).
//
// Uso:
//   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... \
//     node tools/google-oauth/get-refresh-token.mjs
//
// Requiere un OAuth Client ID tipo "Desktop app" creado en Google Cloud
// Console (APIs & Services > Credentials) con la Gmail API habilitada.
// =============================================================================
import { createServer } from 'node:http';

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'Falta GOOGLE_OAUTH_CLIENT_ID y/o GOOGLE_OAUTH_CLIENT_SECRET en el entorno.\n' +
      'Uso: GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... node tools/google-oauth/get-refresh-token.mjs',
  );
  process.exit(1);
}

// Puerto efímero elegido por el OS: los clientes OAuth "Desktop app" de
// Google aceptan cualquier puerto en http://127.0.0.1:<puerto> como
// redirect_uri sin tener que registrarlo de antemano ("loopback flow").
const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const redirectUri = `http://127.0.0.1:${port}`;

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPE);
// access_type=offline + prompt=consent: sin esto Google no siempre emite un
// refresh_token (sólo la primera vez que se autoriza, salvo que se fuerce).
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

console.log('\nAbre esta URL en el navegador con la cuenta Gmail que va a enviar los correos:\n');
console.log(authUrl.toString());
console.log('\nEsperando el consentimiento...\n');

const { code } = await new Promise((resolve, reject) => {
  server.on('request', (req, res) => {
    const url = new URL(req.url, redirectUri);
    const errorParam = url.searchParams.get('error');
    if (errorParam) {
      res.end('Autorización rechazada. Puedes cerrar esta pestaña.');
      reject(new Error(`Google devolvió error=${errorParam}`));
      return;
    }
    const authCode = url.searchParams.get('code');
    if (!authCode) return; // favicon.ico u otra petición sin 'code'
    res.end('Autorización recibida. Puedes cerrar esta pestaña y volver a la terminal.');
    resolve({ code: authCode });
  });
});
server.close();

const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  }).toString(),
});

const tokens = await tokenResponse.json();
if (!tokenResponse.ok) {
  console.error('\nGoogle rechazó el intercambio del código:', tokens);
  process.exit(1);
}

if (!tokens.refresh_token) {
  console.error(
    '\nGoogle no devolvió refresh_token. Esto pasa si esta cuenta ya había ' +
      'autorizado este Client ID antes: revoca el acceso en ' +
      'https://myaccount.google.com/permissions y vuelve a correr este script.',
  );
  process.exit(1);
}

console.log('\n¡Listo! Agrega esto a tu .env:\n');
console.log(`GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`);
console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
console.log('GOOGLE_SENDER_EMAIL=<la cuenta Gmail con la que acabas de autorizar>');
console.log();
