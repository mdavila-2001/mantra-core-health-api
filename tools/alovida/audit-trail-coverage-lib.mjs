// =============================================================================
// Bitácora transversal — análisis estático de cobertura (lógica pura).
// =============================================================================
// Lo usa `audit-trail-coverage.mjs` (el control de CI) y lo prueba
// `audit-trail-coverage.test.mjs`. No lee disco: recibe textos.
//
// Regla que hace cumplir (informe C §8.4.4): toda ruta que muta
// (`@Post/@Put/@Patch/@Delete`) deja rastro. Con `AuditTrailInterceptor`
// registrado, una ruta autenticada lo deja sola; las únicas que no son:
//   - las `@Public()`: sin actor no hay sello (`audit_log.user_id` NOT NULL);
//   - las marcadas `@SkipAuditTrail(motivo)`.
// Ambas tienen que figurar en la allowlist con su rastro alternativo.
// =============================================================================

export const MUTATING_VERBS = new Set(['Post', 'Put', 'Patch', 'Delete']);

const HTTP_DECORATOR = /@(Get|Post|Put|Patch|Delete)\(\s*([^)]*)\)/;
const STRING_LITERAL = /^\s*(['"`])((?:(?!\1).)*)\1/;

/** Primer literal de cadena de una lista de argumentos, o `''`. */
export function firstStringLiteral(args) {
  const trimmed = args.trim();
  if (trimmed.startsWith('[')) return firstStringLiteral(trimmed.slice(1));
  const literal = STRING_LITERAL.exec(trimmed);
  return literal ? literal[2] : '';
}

/** `/a/:b/c` a partir de las rutas del controlador y del handler. */
export function joinRouteTemplate(controllerPath, handlerPath) {
  const joined = [controllerPath, handlerPath]
    .flatMap((part) => part.split('/'))
    .filter((segment) => segment.length > 0)
    .join('/');
  return `/${joined}`;
}

/**
 * Argumentos de un decorador que puede abrirse en una línea y cerrarse en otra
 * (`@SkipAuditTrail(\n  'motivo',\n)`). Devuelve el texto entre los paréntesis.
 */
function decoratorArguments(lines, start, name) {
  const opening = lines[start].indexOf(`@${name}(`);
  if (opening === -1) return null;
  let text = lines[start].slice(opening + name.length + 2);
  let depth = 1;
  let out = '';
  let i = start;
  for (;;) {
    for (const ch of text) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (depth === 0) return out;
      out += ch;
    }
    i++;
    if (i >= lines.length) return out;
    text = `\n${lines[i]}`;
  }
}

/**
 * Motivo de `@SkipAuditTrail(...)` tal como está escrito: un literal (sin
 * comillas) o el nombre de la constante que lo guarda. `''` = sin motivo.
 */
function skipReasonText(args) {
  const raw = (args ?? '').trim().replace(/,$/, '').trim();
  if (STRING_LITERAL.test(raw)) return firstStringLiteral(raw).trim();
  return raw;
}

/**
 * Rutas declaradas en un archivo de controlador, con lo que importa para la
 * bitácora. Supone el formato de Prettier del repo: decoradores de clase en
 * columna 0 y de método a dos espacios.
 */
export function parseControllerRoutes(text) {
  const lines = text.split(/\r?\n/);
  // Un archivo puede declarar DTOs antes del controlador: la clase que cuenta
  // es la primera `export class` después de `@Controller(`.
  const controllerLine = lines.findIndex((l) => /^@Controller\(/.test(l));
  if (controllerLine === -1) return [];
  const classLine = lines.findIndex(
    (l, i) => i > controllerLine && /^export class \w+/.test(l),
  );
  if (classLine === -1) return [];

  // Bloque de decoradores de la clase: hacia arriba desde `export class`
  // mientras sean decoradores (o sus continuaciones multilínea).
  let blockStart = classLine;
  while (blockStart > 0 && /^(@|\s|\)|\}|\])/.test(lines[blockStart - 1]) &&
    lines[blockStart - 1].trim() !== '' && !/^\s*(\*|\/)/.test(lines[blockStart - 1]))
    blockStart--;
  const header = lines.slice(blockStart, classLine);

  const controllerPath = firstStringLiteral(
    decoratorArguments(lines, controllerLine, 'Controller') ?? '',
  );
  // En el header sólo los decoradores de clase empiezan en columna 0 con `@`.
  const classIsPublic = header.some((l) => /^@Public\(/.test(l));
  const classSkipIndex = header.findIndex((l) => /^@SkipAuditTrail\(/.test(l));
  const classSkipReason =
    classSkipIndex === -1
      ? undefined
      : skipReasonText(
          decoratorArguments(lines, blockStart + classSkipIndex, 'SkipAuditTrail'),
        );

  const routes = [];
  let pending = [];
  for (let i = classLine + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^ {2}@\w/.test(line)) {
      pending.push(i);
      continue;
    }
    // Comentarios entre decoradores no cortan el bloque.
    if (pending.length > 0 && /^\s*(\/\/|\/\*|\*)/.test(line)) continue;
    // Un decorador abierto en varias líneas sigue siendo del mismo bloque.
    if (pending.length > 0 && /^ {3,}|^ {2}[)\]}]/.test(line)) continue;
    const handler = /^ {2}(?:async\s+)?([A-Za-z_]\w*)\s*\(/.exec(line);
    if (handler && pending.length > 0) {
      const http = pending
        .map((at) => ({ at, match: HTTP_DECORATOR.exec(lines[at]) }))
        .find((d) => d.match);
      if (http) {
        const has = (name) =>
          pending.some((at) => lines[at].trimStart().startsWith(`@${name}(`));
        const skipAt = pending.find((at) =>
          lines[at].trimStart().startsWith('@SkipAuditTrail('),
        );
        routes.push({
          verb: http.match[1],
          template: joinRouteTemplate(
            controllerPath,
            firstStringLiteral(http.match[2]),
          ),
          line: http.at + 1,
          handler: handler[1],
          isPublic: classIsPublic || has('Public'),
          skipReason:
            skipAt === undefined
              ? classSkipReason
              : skipReasonText(decoratorArguments(lines, skipAt, 'SkipAuditTrail')),
          hasAuditTrail: has('AuditTrail'),
          hasAccessLogged: has('AccessLogged'),
        });
      }
    }
    pending = [];
  }
  return routes;
}

/** Clave de allowlist de una ruta: verbo y plantilla, únicos en toda la API. */
export const routeKey = (route) =>
  `${route.verb.toUpperCase()} ${route.template}`;

/**
 * Cómo queda trazada una ruta que muta:
 *   - `SEALED`: la sella el interceptor (autenticada, sin exclusión);
 *   - `SKIPPED`: excluida con `@SkipAuditTrail`;
 *   - `PUBLIC`: `@Public()`, sin actor que sellar.
 */
export function classifyMutation(route) {
  if (route.isPublic) return 'PUBLIC';
  if (route.skipReason !== undefined) return 'SKIPPED';
  return 'SEALED';
}

/**
 * ¿`app.module.ts` registra el interceptor como global y DESPUÉS del de tenant?
 * El orden importa: dentro del de tenant corre en su contexto y en su
 * transacción (RLS), que es lo que vuelve atómico el sello de éxito.
 */
export function interceptorRegistration(appModuleText) {
  const audit = appModuleText.search(
    /provide:\s*APP_INTERCEPTOR,\s*useClass:\s*AuditTrailInterceptor/,
  );
  const tenant = appModuleText.search(
    /provide:\s*APP_INTERCEPTOR,\s*useClass:\s*TenantContextInterceptor/,
  );
  if (audit === -1) return 'MISSING';
  if (tenant !== -1 && audit < tenant) return 'BEFORE_TENANT';
  return 'OK';
}

/**
 * Llamadas que sellan en `audit.audit_log`; el `action:` literal que las sigue
 * (hasta 8 líneas) es una acción de bitácora. Se acota a ellas porque `action`
 * también es un campo común (`'READ'` en el PDP de authz) que no es auditoría.
 */
const SEAL_CALL = /(?:auditTrail|audit)\.record\(|auditLogRepo\.append\(|@AuditTrail\(/;

/**
 * Acciones de bitácora literales por módulo. Dos módulos con la misma acción
 * son una colisión: quien lee la bitácora no podría distinguirlas (informe C
 * §1.4.3 — `action` es texto libre y nada lo impedía).
 */
export function collectActionLiterals(files) {
  const byAction = new Map();
  for (const { file, text } of files) {
    const mod = /modules\/([^/]+)\//.exec(file)?.[1];
    if (!mod) continue;
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (!SEAL_CALL.test(line)) return;
      const window = lines.slice(i, i + 8).join('\n');
      for (const m of window.matchAll(/\baction:\s*'([A-Z][A-Z0-9_]+)'/g)) {
        const modules = byAction.get(m[1]) ?? new Set();
        modules.add(mod);
        byAction.set(m[1], modules);
      }
    });
  }
  return byAction;
}

/**
 * Aplica la regla a todos los controladores.
 *
 * @param {{ controllers: {file: string, text: string}[], appModuleText: string,
 *   allowlist: Map<string, string>, sources: {file: string, text: string}[] }} input
 * @returns {{ violations: {code: string, where: string, msg: string}[],
 *   summary: Map<string, Record<string, number>> }}
 */
export function checkAuditTrailCoverage({
  controllers,
  appModuleText,
  allowlist,
  sources = [],
}) {
  const violations = [];
  const add = (code, where, msg) => violations.push({ code, where, msg });
  const summary = new Map();
  const seenKeys = new Set();

  const registration = interceptorRegistration(appModuleText);
  if (registration === 'MISSING')
    add(
      'INTERCEPTOR_NOT_REGISTERED',
      'src/app.module.ts',
      'AuditTrailInterceptor no está registrado como APP_INTERCEPTOR: ninguna ruta deja sello.',
    );
  if (registration === 'BEFORE_TENANT')
    add(
      'INTERCEPTOR_ORDER',
      'src/app.module.ts',
      'AuditTrailInterceptor debe registrarse DESPUÉS de TenantContextInterceptor.',
    );

  for (const { file, text } of controllers) {
    const mod = /modules\/([^/]+)\//.exec(file)?.[1] ?? 'app';
    for (const route of parseControllerRoutes(text)) {
      if (!MUTATING_VERBS.has(route.verb)) continue;
      const key = routeKey(route);
      seenKeys.add(key);
      const kind = classifyMutation(route);
      const counts = summary.get(mod) ?? { SEALED: 0, SKIPPED: 0, PUBLIC: 0 };
      counts[kind]++;
      summary.set(mod, counts);

      const where = `${file}:${route.line}`;
      if (kind === 'SKIPPED' && route.skipReason.length === 0)
        add('EMPTY_SKIP_REASON', where, `${key}: @SkipAuditTrail sin motivo`);
      if (kind !== 'SEALED' && !allowlist.has(key))
        add(
          kind === 'PUBLIC' ? 'UNTRACED_PUBLIC_MUTATION' : 'UNREVIEWED_SKIP',
          where,
          `${key}: muta sin sello de audit_log y no figura en la allowlist`,
        );
    }
  }

  for (const key of allowlist.keys())
    if (!seenKeys.has(key))
      add(
        'STALE_ALLOWLIST',
        'tools/alovida/audit-trail-coverage.mjs',
        `${key}: ya no existe o ya no muta; quitala de la allowlist`,
      );

  for (const [action, modules] of collectActionLiterals(sources))
    if (modules.size > 1)
      add(
        'ACTION_COLLISION',
        [...modules].join(', '),
        `la acción '${action}' la usan módulos distintos`,
      );

  return { violations, summary };
}
