// Cálculo reproducible con la implementación de referencia FIRST/Red Hat.
// Sólo descarga código público de una revisión fija; no transmite código ni datos locales.
// El código descargado se evalúa sin require, process, fetch ni acceso a archivos.
const vm = require('node:vm');
const crypto = require('node:crypto');
const revision = 'b0930b7646be5892492df16ba81cd8d8423eb49a';
const vectors = {
  'F01-clinical': 'AV:N/AC:L/AT:N/PR:L/UI:N/VC:L/VI:H/VA:N/SC:N/SI:N/SA:N',
  'F01-payments': 'AV:N/AC:L/AT:N/PR:L/UI:N/VC:N/VI:H/VA:N/SC:N/SI:N/SA:N',
  'F01-scheduling': 'AV:N/AC:L/AT:N/PR:L/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N',
  'F03-offboarding': 'AV:N/AC:L/AT:P/PR:L/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N',
  'F04-websocket': 'AV:N/AC:L/AT:P/PR:L/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N',
  'F05-logging': 'AV:L/AC:L/AT:P/PR:L/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N',
  'F07-payment-state': 'AV:N/AC:L/AT:N/PR:H/UI:N/VC:N/VI:H/VA:N/SC:N/SI:N/SA:N',
  'F08-throttler': 'AV:N/AC:L/AT:P/PR:N/UI:N/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N',
};
(async () => {
  const url = `https://raw.githubusercontent.com/RedHatProductSecurity/cvss-v4-calculator/${revision}/cvss40.js`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Reference calculator HTTP ${response.status}`);
  const source = await response.text();
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source, sandbox, { timeout: 3000 });
  const results = Object.entries(vectors).map(([id, metrics]) => {
    const vector = `CVSS:4.0/${metrics}`;
    const result = new sandbox.module.exports.CVSS40(vector);
    return { id, vector, score: result.score };
  });
  console.log(JSON.stringify({ url, sha256: crypto.createHash('sha256').update(source).digest('hex'),
    note: 'Puntuaciones base provisionales; supuestos y límites en REPORTE.md.', results }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
