#!/usr/bin/env node
// =============================================================================
// Bitácora transversal ALOVIDA — ninguna ruta que muta sin rastro.
// =============================================================================
// Control de CI del informe C §8.4.4. Estático (no arranca la app ni toca la
// BD), como `guardrails.mjs`. Rompe el build si:
//   - INTERCEPTOR_NOT_REGISTERED / INTERCEPTOR_ORDER  AuditTrailInterceptor no
//                                    está como APP_INTERCEPTOR, o va antes del de tenant;
//   - UNTRACED_PUBLIC_MUTATION       una ruta `@Public()` que muta no figura en
//                                    la allowlist con su rastro alternativo;
//   - UNREVIEWED_SKIP                una `@SkipAuditTrail` no figura en la allowlist;
//   - EMPTY_SKIP_REASON              una `@SkipAuditTrail` sin motivo;
//   - STALE_ALLOWLIST                la allowlist nombra una ruta que ya no existe;
//   - ACTION_COLLISION               dos módulos usan la misma `action` literal.
// Uso: `node tools/alovida/audit-trail-coverage.mjs [--summary]`.
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { sep } from 'node:path';
import { checkAuditTrailCoverage } from './audit-trail-coverage-lib.mjs';

const posix = (p) => p.split(sep).join('/');
const ROOT = posix(process.cwd());
const rel = (p) => p.slice(ROOT.length + 1);

/**
 * Rutas que mutan y NO dejan sello en `audit.audit_log`, cada una con el rastro
 * que sí deja o el motivo por el que no hace falta. Clave: `VERBO /plantilla`.
 * Agregar una entrada es una decisión de revisión: si la ruta toca PHI, dinero,
 * permisos o consentimiento, lo correcto casi siempre es sellarla, no listarla.
 */
const UNAUDITED_MUTATION_ALLOWLIST = new Map([
  // --- Públicas de `iam`: sin sesión todavía, `audit_log.user_id` NOT NULL ---
  // Verificado leyendo cada servicio el 2026-10-09: escriben `iam.security_events`.
  ['POST /iam/auth/register-patient', 'iam.security_events (SEC_ROLE_GRANT) en IamPatientSelfRegistrationService.registerPatient.'],
  ['POST /iam/auth/register-organization', 'iam.security_events en IamOrganizationSelfRegistrationService.registerOrganization.'],
  ['POST /iam/auth/register-practitioner', 'iam.security_events en IamPractitionerSelfRegistrationService.registerPractitioner.'],
  ['POST /iam/auth/activate', 'iam.security_events (éxito y fallo) en IamAssistedRegistrationService.activateAccount.'],
  ['POST /iam/auth/login', 'iam.security_events (SEC_LOGIN / SEC_LOGIN_FAILED) en IamAuthService.performLogin.'],
  ['POST /iam/auth/token/refresh', 'iam.security_events (SEC_TOKEN_REFRESH / SEC_TOKEN_REUSE) en IamAuthService.refresh.'],
  ['POST /iam/auth/forgot-password', 'iam.security_events en IamPasswordResetService.requestReset.'],
  ['POST /iam/auth/reset-password', 'iam.security_events en IamPasswordResetService.resetPassword.'],
  // Sin security_event (no hay concepto de tipo de evento para esto y el modelo
  // no lo declara); el rastro es la propia fila de dominio, NO una tabla WORM.
  ['POST /iam/auth/verify-email', 'iam.email_verifications pasa a VERIFIED con consumed_at + revisión en audit.users_history (HistoryMirrorSubscriber).'],
  ['POST /iam/auth/resend-verification', 'Fila nueva en iam.email_verifications con su emisión y vencimiento.'],
  ['POST /iam/auth/upload-registration-document', 'Archivo anónimo previo al alta (common.files vía uploadAnonymous); se vincula al usuario al registrarse.'],
  ['POST /iam/auth/upload-registration-signature-image', 'Archivo anónimo previo al alta (common.files vía uploadAnonymous); se vincula al usuario al registrarse.'],
  // --- Webhooks entrantes firmados: el emisor es un sistema externo ---
  ['POST /integrations/webhooks/inbound', 'integrations.inbound_messages (deduplicado por firma) en IntegrationsWebhooksService.receiveInbound.'],
  ['POST /webhooks/providers/:providerCode/receipts', 'Acuse del proveedor en messaging (createReceipt) en NotificationsService.recordProviderReceipt.'],
  ['POST /payments/callbacks/:callbackPath', 'Evento de webhook del gateway (recordWebhookEvent) en PaymentsTransactionsService.applyCallback.'],
  ['POST /tracking/webhooks/carriers/:carrierCode', 'Evento de seguimiento (createEvent, deduplicado por referencia externa) en TrackingService.ingestCarrierWebhook.'],
  // --- Cola de mensajería de los workers (`@SkipAuditTrail`) ---
  ...[
    'POST /internal/outbox/relay/run',
    'POST /internal/events/:domainEventId/dispatch',
    'POST /internal/event-deliveries/:id/ack',
    'POST /internal/queues/:code/claim',
    'POST /internal/jobs/:id/complete',
    'POST /internal/jobs/:id/fail',
    'POST /internal/notifications/:requestId/deliver',
  ].map((key) => [
    key,
    'Plomería de cola cada pocos segundos; el rastro es la propia tabla de messaging.',
  ]),
]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = `${dir}/${name}`;
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

const sourceFiles = walk(`${ROOT}/src/modules`).map((p) => ({
  file: rel(p),
  text: readFileSync(p, 'utf8'),
}));
const { violations, summary } = checkAuditTrailCoverage({
  controllers: sourceFiles.filter((f) => f.file.endsWith('.controller.ts')),
  appModuleText: readFileSync(`${ROOT}/src/app.module.ts`, 'utf8'),
  allowlist: UNAUDITED_MUTATION_ALLOWLIST,
  sources: sourceFiles.filter((f) => !f.file.includes('/entities/')),
});

console.log('== Bitácora transversal ALOVIDA ==');
const totals = { SEALED: 0, SKIPPED: 0, PUBLIC: 0 };
for (const counts of summary.values())
  for (const kind of Object.keys(totals)) totals[kind] += counts[kind];
console.log(
  `Rutas que mutan: ${totals.SEALED + totals.SKIPPED + totals.PUBLIC} · ` +
    `selladas por el interceptor: ${totals.SEALED} · ` +
    `excluidas con motivo: ${totals.SKIPPED} · públicas: ${totals.PUBLIC}`,
);
if (process.argv.includes('--summary')) {
  for (const [mod, c] of [...summary].sort(([a], [b]) => a.localeCompare(b)))
    console.log(
      `  ${mod.padEnd(28)} sellan ${String(c.SEALED).padStart(3)} · excluidas ${c.SKIPPED} · públicas ${c.PUBLIC}`,
    );
}

const byCode = {};
for (const v of violations) (byCode[v.code] ??= []).push(v);
for (const code of Object.keys(byCode)) {
  console.log(`\n[${code}] ${byCode[code].length} hallazgo(s):`);
  for (const v of byCode[code]) console.log(`  ${v.where} — ${v.msg}`);
}
if (violations.length === 0) console.log('Sin violaciones. ✓');
console.log(`\nTotal: ${violations.length} (todas bloqueantes)`);
process.exit(violations.length > 0 ? 1 : 0);
