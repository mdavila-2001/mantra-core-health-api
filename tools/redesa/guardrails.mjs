#!/usr/bin/env node
// =============================================================================
// Guardrails REDESA — checks estáticos de los criterios de rechazo técnico.
// =============================================================================
// Convierte en un check de CI (rompe el build) los antipatrones que las reglas
// canónicas prohíben. Es estático (no arranca la app ni toca la BD): analiza los
// controladores y el catálogo ORM. Uso: `node tools/redesa/guardrails.mjs`.
//
// Criterios implementados:
//   - HARD_DELETE_RESTRICTED_DATA      @Delete sobre dominios inmutables
//   - GENERIC_CRUD_ON_IMMUTABLE        @Patch/@Put sobre recursos inmutables
//   - UNSCOPED_MUTATION                endpoint mutante sin @Roles y sin @Public
//   - CASCADE_ON_RESTRICTED            ON DELETE CASCADE hacia dominios protegidos
//   - TENANT_SCOPE_MISSING             listado/conteo de entidad con tenant_id
//                                      sin ningún rastro de `tenantId` cerca
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/** Dominios cuyos datos son inmutables/protegidos (clínico, legal, financiero, auditoría). */
const RESTRICTED_DOMAINS = [
  'clinical',
  'clinical_ext',
  'chart',
  'audit',
  'accounting',
];

/** Recursos inmutables: no admiten edición/borrado directo (solo comandos de negocio). */
const IMMUTABLE_RESOURCE =
  /(medication|prescription|clinical-?note|chart-note|journal|ledger|audit)/i;

/** Verbos de negocio permitidos sobre recursos inmutables (no son CRUD genérico). */
const ALLOWED_COMMANDS =
  /(amend|addend|invalidate|replace|renew|reverse|sign|cosign|finalize|release|issue|deprecate|version|dsar)/i;

/**
 * Controladores cuyos endpoints mutantes están autenticados por el `JwtAuthGuard`
 * GLOBAL (APP_GUARD en common/auth) y autorizados a nivel de RECURSO en el servicio
 * (pertenencia/propiedad), no por `@Roles`. El analizador es estático y no ve el
 * guard global ni la autorización de recurso, así que sin esta allowlist los marca
 * como UNSCOPED_MUTATION (falso positivo, verificado en el triage 2026-07):
 *   - telemetry: ingesta autenticada por diseño (SDK/portal), no scoping por rol.
 *   - community: features sociales peer-to-peer (mensajería, reseñas, encuestas,
 *     grupos) gobernadas por participación/propiedad en el servicio.
 *   - common: recursos propios del actor (archivos, direcciones, identificadores)
 *     con `actorUserId` en el servicio.
 * NO exime del requisito de autenticación (el guard global lo garantiza).
 */
const AUTHN_NON_ROLE_ALLOWLIST =
  /modules\/(telemetry|community|common)\/controllers\//;

/** ¿Existe un JwtAuthGuard registrado como APP_GUARD global? (defensa por defecto) */
function hasGlobalJwtGuard() {
  try {
    const authModule = readFileSync(
      join(SRC, 'common', 'auth', 'auth.module.ts'),
      'utf8',
    );
    return /APP_GUARD/.test(authModule) && /JwtAuthGuard/.test(authModule);
  } catch {
    return false;
  }
}
const GLOBAL_JWT_GUARD = hasGlobalJwtGuard();

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

const rel = (p) => p.replace(ROOT + '/', '');
const violations = [];
const add = (code, file, line, msg) =>
  violations.push({ code, file: rel(file), line, msg });

// --- Controladores -----------------------------------------------------------
const controllers = walk(join(SRC, 'modules')).filter((f) =>
  f.endsWith('.controller.ts'),
);

for (const file of controllers) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const domain = file.match(/modules\/([^/]+)\//)?.[1] ?? '';
  const classHasRoles = /@Roles\(/.test(text);
  const isImmutableCtrl = IMMUTABLE_RESOURCE.test(file);

  // Bloque por método: acumula decoradores hasta el nombre del handler.
  let pendingDecorators = [];
  lines.forEach((raw, i) => {
    const l = raw.trim();
    const mhttp = l.match(/@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/);
    if (l.startsWith('@')) pendingDecorators.push({ text: l, line: i + 1 });
    if (!mhttp) return;

    const verb = mhttp[1];
    const path = mhttp[2] || '';
    const near = lines.slice(i, i + 6).join(' ');
    const hasPublic =
      pendingDecorators.some((d) => /@Public\(/.test(d.text)) ||
      /@Public\(/.test(near);
    const hasRolesHere =
      classHasRoles ||
      pendingDecorators.some((d) => /@Roles\(/.test(d.text)) ||
      /@Roles\(/.test(near);

    // HARD_DELETE sobre dominio protegido.
    if (verb === 'Delete' && RESTRICTED_DOMAINS.includes(domain)) {
      add(
        'HARD_DELETE_RESTRICTED_DATA',
        file,
        i + 1,
        `@Delete en dominio protegido '${domain}': ${path}`,
      );
    }
    // CRUD genérico sobre recurso inmutable (Patch/Put/Delete sin verbo de negocio).
    if (
      isImmutableCtrl &&
      ['Put', 'Patch', 'Delete'].includes(verb) &&
      !ALLOWED_COMMANDS.test(path)
    ) {
      add(
        'GENERIC_CRUD_ON_IMMUTABLE',
        file,
        i + 1,
        `@${verb} sobre recurso inmutable sin comando de negocio: ${path}`,
      );
    }
    // Endpoint mutante sin autorización por rol y sin ser público. Con guard JWT
    // global, "sin @Roles" NO significa "sin autenticación"; se exime a los
    // controladores autenticados+autorizados a nivel de recurso (allowlist).
    if (
      ['Post', 'Put', 'Patch', 'Delete'].includes(verb) &&
      !hasRolesHere &&
      !hasPublic &&
      !(GLOBAL_JWT_GUARD && AUTHN_NON_ROLE_ALLOWLIST.test(file))
    ) {
      add(
        'UNSCOPED_MUTATION',
        file,
        i + 1,
        `@${verb} mutante sin @Roles ni @Public: ${path}`,
      );
    }
    pendingDecorators = [];
  });
}

// --- Catálogo ORM: ON DELETE CASCADE hacia dominios protegidos ---------------
const fkDir = join(SRC, 'orm', 'catalog', 'foreign-keys');
try {
  for (const file of walk(fkDir)) {
    const text = readFileSync(file, 'utf8');
    if (
      /CASCADE/.test(text) &&
      RESTRICTED_DOMAINS.some((d) => text.includes(`${d}.`))
    ) {
      text.split(/\r?\n/).forEach((l, i) => {
        if (
          /CASCADE/i.test(l) &&
          RESTRICTED_DOMAINS.some((d) => l.includes(`${d}.`))
        )
          add('CASCADE_ON_RESTRICTED', file, i + 1, l.trim().slice(0, 100));
      });
    }
  }
} catch {
  // Sin catálogo de FKs: se omite este check.
}

// --- Aislamiento por tenant: listados/conteos sin filtro tenantId -----------
// Reproduce estáticamente el patrón encontrado tres veces en revisión manual
// (2026-07-29): un repositorio para una entidad con `tenant_id` expone
// `em.find`/`em.count` (plural — a diferencia de `findOne` por PK, donde el
// servicio puede verificar pertenencia post-fetch) sin acotar por tenant. La
// primera vez fue `promotions-loyalty.repository.ts:findActivePrograms`
// (expuesto sin filtro a roles de negocio no-SYSTEM); la segunda, 10
// repositorios de solo lectura nuevos que nunca declaraban `tenantId` en
// ningún método. Ver ESTADO-Y-PENDIENTES.md.
const TENANT_ENTITY_CLASSES = new Set();
try {
  for (const f of walk(join(SRC, 'modules')).filter((f) =>
    /\/entities\//.test(f),
  )) {
    const text = readFileSync(f, 'utf8');
    if (!/fieldName:\s*'tenant_id'/.test(text)) continue;
    for (const m of text.matchAll(/export class (\w+)/g))
      TENANT_ENTITY_CLASSES.add(m[1]);
  }
} catch {
  // Sin entidades: se omite este check.
}

/**
 * Módulos deliberadamente globales/cross-tenant por diseño de arquitectura
 * (barrido SYSTEM/SECURITY_ADMIN o atribución sin ser límite de acceso, ver
 * ESTADO-Y-PENDIENTES.md): su `tenant_id` no es un perímetro de autorización,
 * así que un repositorio entero sin `tenantId` ahí es esperado, no un hallazgo.
 * `consent` queda FUERA de esta lista a propósito: mezcla barridos globales
 * con operaciones tenant-scoped reales en el mismo módulo.
 */
const GLOBAL_DOMAIN_MODULES = new Set([
  'identity_assurance',
  'delegated_access',
  'pharmacy_inventory',
  'time_series',
]);

/** Extrae el objeto `{ ... }` balanceado que arranca en el primer `{` a partir de `from`. */
function extractBalancedBraces(text, from) {
  const start = text.indexOf('{', from);
  if (start === -1) return '';
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start);
}

// Claves como `userId`/`patientProfileId`/`consentId`/`resourceId` ya acotan la
// consulta a un principal o recurso puntual (no a "todo el tenant"); el
// servicio que las llama las deriva del actor autenticado o de un recurso ya
// verificado, no de un listado abierto. `stateConceptId`/`...ConceptId` NO
// cuentan: son categorías amplias (terminología), igual que el
// `stateConceptId` suelto que sí causó el bug original de loyalty.
const SPECIFIC_ID_KEY = /(?<!Concept)Id\b/;

/**
 * `em.count(Entity, {})` con criterio vacío: idioma reconocido de generación
 * de correlativo legible (`ENV-000123`, `DEP-000045`, `DEF-00012`) — cuenta
 * TODAS las filas a propósito para obtener un candidato, y la unicidad real
 * la valida el `findByNumber` inmediato después contra ese mismo correlativo.
 * No filtra ni expone datos de ningún tenant, así que no es un hallazgo de
 * aislamiento (verificado en el triage 2026-07-30: `tracking.countShipments`,
 * `ops-releases.countDeployments`, `qa-runs.countDefects`).
 */
const isEmptyCriteria = (criteria) => /^\{\s*\}$/.test(criteria.trim());

/**
 * Métodos de repositorio que SÍ cruzan tenants a propósito: descubrimiento de
 * un worker SYSTEM (barridos de vencidos, colas reclamables) donde ningún rol
 * de negocio los alcanza directamente — el propio método ya lo documenta en
 * un comentario. Confirmados uno por uno en el triage 2026-07-30 leyendo cada
 * caller; si agregas uno nuevo, define primero por qué el barrido no puede
 * acotarse por tenant (normalmente: "no se sabe de antemano qué tenants
 * tienen algo vencido").
 */
const TENANT_SCOPE_SYSTEM_SWEEP_ALLOWLIST = new Set([
  'src/modules/automation/repositories/automation-governance.repository.ts#findEnabledCalendarTriggers',
  'src/modules/billing/repositories/practices-lookup.repository.ts#findActive',
  'src/modules/consent/repositories/consents.repository.ts#findExpirable',
  'src/modules/consent/repositories/hipaa-authorizations.repository.ts#findExpirable',
  'src/modules/consent/repositories/privacy-restrictions.repository.ts#findExpirable',
  'src/modules/messaging/repositories/notifications.repository.ts#findClaimableRequests',
  'src/modules/messaging/repositories/outbox.repository.ts#claimPendingOutbox',
  'src/modules/qa_lab/repositories/qa-catalog.repository.ts#claimDueSchedules',
  'src/modules/reporting/repositories/reporting-runs.repository.ts#findDueSchedules',
  'src/modules/tracking/repositories/tracking.repository.ts#findOpenSubjectsForScan',
  'src/modules/vector_rag/repositories/vector-catalog.repository.ts#findQueuedJobs',
  'src/modules/workflow/repositories/workflow-runtime.repository.ts#findDueInstancesForUpdate',
]);

/** Nombre del método de clase que contiene la línea `atLine` (busca hacia atrás). */
function enclosingMethodName(lines, atLine) {
  for (let i = atLine; i >= 0; i--) {
    const m = lines[i].match(/^\s{2}(?:async\s+)?([a-zA-Z_]\w*)\s*\(/);
    if (m) return m[1];
  }
  return null;
}

const repoFiles = walk(join(SRC, 'modules')).filter((f) =>
  /\/repositories\//.test(f),
);
for (const file of repoFiles) {
  const mod = file.match(/modules\/([^/]+)\//)?.[1] ?? '';
  if (GLOBAL_DOMAIN_MODULES.has(mod)) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);

  for (const m of text.matchAll(/em\.(find|count)\(\s*([A-Z]\w*)\b/g)) {
    const [, verb, cls] = m;
    if (!TENANT_ENTITY_CLASSES.has(cls)) continue;

    const i = text.slice(0, m.index).split(/\r?\n/).length - 1;

    const criteria = extractBalancedBraces(text, m.index + m[0].length - 1);
    if (verb === 'count' && isEmptyCriteria(criteria)) continue;

    const method = enclosingMethodName(lines, i);
    if (method && TENANT_SCOPE_SYSTEM_SWEEP_ALLOWLIST.has(`${rel(file)}#${method}`))
      continue;

    // Ventana generosa alrededor de la llamada: firma del método suele caber
    // en ±20 líneas (mismo margen crudo que el resto del archivo usa para
    // "near"). Si `tenantId` aparece ahí (parámetro o spread condicional), la
    // llamada ya está acotada.
    const windowStart = Math.max(0, i - 20);
    const windowEnd = Math.min(lines.length, i + 10);
    const window = lines.slice(windowStart, windowEnd).join(' ');
    if (/\btenantId\b/.test(window)) continue;

    // El criterio ya acota por un id de principal/recurso puntual (patrón PDP:
    // userId, patientProfileId, consentId, resourceId, ...) — no es un listado
    // abierto de todo el tenant.
    const keys = [...criteria.matchAll(/[{,]\s*([A-Za-z]\w*)\s*[,:}]/g)].map(
      (k) => k[1],
    );
    if (keys.some((k) => k !== 'tenantId' && SPECIFIC_ID_KEY.test(k)))
      continue;

    add(
      'TENANT_SCOPE_MISSING',
      file,
      i + 1,
      `em.${verb}(${cls}, ...) sin 'tenantId' ni un id de principal/recurso puntual en el criterio (tenant_id es límite de acceso en este módulo)`,
    );
  }
}

// --- Reporte -----------------------------------------------------------------
const byCode = {};
for (const v of violations) (byCode[v.code] ??= []).push(v);

console.log('== Guardrails REDESA ==');
for (const code of Object.keys(byCode)) {
  console.log(`\n[${code}] ${byCode[code].length} hallazgo(s):`);
  for (const v of byCode[code].slice(0, 40))
    console.log(`  ${v.file}:${v.line} — ${v.msg}`);
  if (byCode[code].length > 40)
    console.log(`  … +${byCode[code].length - 40} más`);
}
if (violations.length === 0) console.log('Sin violaciones. ✓');

// UNSCOPED_MUTATION es informativo (puede haber excepciones legítimas); los demás
// rompen el build.
const blocking = violations.filter((v) => v.code !== 'UNSCOPED_MUTATION');
console.log(
  `\nTotal: ${violations.length} (bloqueantes: ${blocking.length}, informativos: ${violations.length - blocking.length})`,
);
process.exit(blocking.length > 0 ? 1 : 0);
