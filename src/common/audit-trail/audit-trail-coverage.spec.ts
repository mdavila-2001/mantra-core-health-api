import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import type { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import {
  METHOD_METADATA,
  MODULE_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import {
  AUDITED_KEY,
  NOT_AUDITED_KEY,
  type AuditedOptions,
} from './audit-trail.decorators';
import { joinRouteTemplate } from './route-audit-identity';

/**
 * Candado de bitácora (informe C §8.4.4): toda ruta que muta declara qué sella.
 *
 * Recorre la misma metadata que Nest lee al arrancar —`AppModule` → módulos →
 * controladores → handlers— y exige que cada `POST/PUT/PATCH/DELETE` lleve
 * `@Audited({ action, entity })` o `@NotAudited(motivo)`. Sin esto, el próximo
 * módulo nace sellando `HTTP POST /ruta`, que no dice qué pasó.
 *
 * Las rutas que todavía no tienen nombre de negocio viven en
 * `audit-trail-baseline.json`, que SÓLO puede achicarse: falla si una ruta
 * nueva no tiene decorador, si una del baseline ya lo tiene o ya no existe, y
 * si el tamaño no coincide con `BASELINE_SIZE`. Mientras esperan, el
 * interceptor las sella igual con la identidad derivada de la ruta.
 */

/**
 * Tamaño exacto del baseline. Al decorar rutas, se quitan del JSON y se baja
 * este número en el mismo cambio; subirlo es una decisión de revisión.
 */
const BASELINE_SIZE = 728;

/** Ver `app.module.wiring.spec.ts`: importar `AppModule` valida estas variables. */
const PLACEHOLDER_DB_ENV: Record<string, string> = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USER: 'audit_trail_spec',
  DB_PASSWORD: 'audit_trail_spec',
  DB_NAME: 'audit_trail_spec',
};

const ROOT = process.cwd();
const BASELINE_FILE = join(
  ROOT,
  'src',
  'common',
  'audit-trail',
  'audit-trail-baseline.json',
);
const MODULES_DIR = join(ROOT, 'src', 'modules');

const MUTATING_VERBS = new Map<RequestMethod, string>([
  [RequestMethod.POST, 'POST'],
  [RequestMethod.PUT, 'PUT'],
  [RequestMethod.PATCH, 'PATCH'],
  [RequestMethod.DELETE, 'DELETE'],
]);

/** `MEDICATION_SIGNED`, `CONSENT_CAPTURED`: verbo de negocio en MAYÚSCULAS. */
const ACTION_FORMAT = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;
/** `medication_request`: nombre de tabla en singular, snake_case. */
const ENTITY_FORMAT = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

type Importable = Type | DynamicModule | ForwardReference | Promise<unknown>;

interface MutatingRoute {
  /** `VERBO /plantilla`, la misma clave que usa el baseline. */
  readonly key: string;
  readonly handler: string;
  readonly audited?: AuditedOptions;
  readonly notAudited?: string;
  readonly isPublic: boolean;
}

function moduleEntryOf(entry: Importable): Type | DynamicModule | undefined {
  if (!entry || entry instanceof Promise) return undefined;
  if (typeof entry === 'function') return entry;
  if ('forwardRef' in entry) return entry.forwardRef() as Type;
  if ('module' in entry) return entry;
  return undefined;
}

/** Controladores de todo módulo alcanzable desde `root`, como los ve Nest. */
function controllersReachableFrom(root: Type): Set<Type> {
  const seen = new Set<Type>();
  const controllers = new Set<Type>();
  const pending: Array<Type | DynamicModule> = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    const moduleClass =
      typeof current === 'function' ? current : current.module;
    const dynamicControllers =
      typeof current === 'function' ? [] : (current.controllers ?? []);
    for (const controller of dynamicControllers) controllers.add(controller);
    if (seen.has(moduleClass)) continue;
    seen.add(moduleClass);
    const declared = (Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      moduleClass,
    ) ?? []) as Type[];
    for (const controller of declared) controllers.add(controller);
    const imports = [
      ...((Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleClass) ??
        []) as Importable[]),
      ...(typeof current === 'function' ? [] : (current.imports ?? [])),
    ] as Importable[];
    for (const entry of imports) {
      const next = moduleEntryOf(entry);
      if (next) pending.push(next);
    }
  }
  return controllers;
}

function firstPath(value: unknown): string {
  if (Array.isArray(value)) return firstPath(value[0]);
  return typeof value === 'string' ? value : '';
}

/** Handlers del prototipo y de sus ancestros, sin repetir nombres. */
function handlersOf(controller: Type): Array<[string, object]> {
  const found = new Map<string, object>();
  let proto: object | null = controller.prototype as object;
  while (proto && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      const value: unknown = Reflect.get(proto, name);
      if (name !== 'constructor' && typeof value === 'function')
        if (!found.has(name)) found.set(name, value);
    }
    proto = Object.getPrototypeOf(proto) as object | null;
  }
  return [...found];
}

function metadataOf<T>(key: string, handler: object, controller: Type) {
  return (Reflect.getMetadata(key, handler) ??
    Reflect.getMetadata(key, controller)) as T | undefined;
}

function mutatingRoutesOf(controller: Type): MutatingRoute[] {
  const controllerPath = firstPath(
    Reflect.getMetadata(PATH_METADATA, controller),
  );
  const routes: MutatingRoute[] = [];
  for (const [name, handler] of handlersOf(controller)) {
    const method = Reflect.getMetadata(METHOD_METADATA, handler) as
      RequestMethod | undefined;
    const verb = method === undefined ? undefined : MUTATING_VERBS.get(method);
    if (!verb) continue;
    const template = joinRouteTemplate(
      controllerPath,
      firstPath(Reflect.getMetadata(PATH_METADATA, handler)),
    );
    routes.push({
      key: `${verb} ${template}`,
      handler: `${controller.name}.${name}`,
      audited: metadataOf<AuditedOptions>(AUDITED_KEY, handler, controller),
      notAudited: metadataOf<string>(NOT_AUDITED_KEY, handler, controller),
      isPublic:
        metadataOf<boolean>(IS_PUBLIC_KEY, handler, controller) === true,
    });
  }
  return routes;
}

function isDecorated(route: MutatingRoute): boolean {
  return route.audited !== undefined || route.notAudited !== undefined;
}

function readBaseline(): string[] {
  return JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) as string[];
}

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path));
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts'))
      files.push(path);
  }
  return files;
}

/**
 * Llamadas que sellan en `audit.audit_log` y el decorador que las nombra; el
 * `action:` literal que las sigue (hasta 8 líneas) es una acción de bitácora.
 * Se acota a ellas porque `action` también es un campo común (`'READ'` en el
 * PDP de authz) que no es auditoría.
 */
const SEAL_CALL =
  /(?:auditTrail|audit)\.record\(|auditLogRepo\.append\(|@Audited\(/;

/** Módulos (carpeta de `src/modules`) que usan cada acción literal. */
function actionLiteralsByModule(): Map<string, Set<string>> {
  const byAction = new Map<string, Set<string>>();
  for (const file of sourceFiles(MODULES_DIR)) {
    const moduleName = relative(MODULES_DIR, file).split(sep)[0];
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!SEAL_CALL.test(line)) return;
      const window = lines.slice(index, index + 8).join('\n');
      for (const match of window.matchAll(/\baction:\s*'([A-Z][A-Z0-9_]+)'/g)) {
        const modules = byAction.get(match[1]) ?? new Set<string>();
        modules.add(moduleName);
        byAction.set(match[1], modules);
      }
    });
  }
  return byAction;
}

describe('bitácora: toda ruta que muta declara qué sella', () => {
  let routes: MutatingRoute[];
  let appProviders: unknown[];

  beforeAll(async () => {
    for (const [key, value] of Object.entries(PLACEHOLDER_DB_ENV))
      process.env[key] ??= value;
    // Por ruta absoluta: un `import()` relativo sin extensión no resuelve con
    // `moduleResolution: nodenext` (ver `app.module.wiring.spec.ts`).
    const { AppModule } = (await import(
      join(ROOT, 'src', 'app.module.ts')
    )) as { AppModule: Type };
    routes = [...controllersReachableFrom(AppModule)].flatMap(mutatingRoutesOf);
    appProviders = (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) ??
      []) as unknown[];
  });

  it('encuentra las rutas que mutan (el inventario no quedó vacío)', () => {
    // Si la lectura de la metadata dejara de ver handlers, todo lo de abajo
    // pasaría sin haber mirado nada.
    expect(routes.length).toBeGreaterThan(1000);
  });

  it('AuditTrailInterceptor es global y va después de TenantContextInterceptor', () => {
    const interceptors = appProviders
      .filter(
        (provider): provider is { provide: string; useClass: Type } =>
          typeof provider === 'object' &&
          provider !== null &&
          'provide' in provider &&
          'useClass' in provider &&
          provider.provide === APP_INTERCEPTOR,
      )
      .map((provider) => provider.useClass.name);
    const audit = interceptors.indexOf('AuditTrailInterceptor');
    expect(audit).toBeGreaterThan(
      interceptors.indexOf('TenantContextInterceptor'),
    );
  });

  it('ninguna ruta sin @Audited ni @NotAudited fuera del baseline', () => {
    const baseline = new Set(readBaseline());
    const missing = routes
      .filter((route) => !isDecorated(route) && !baseline.has(route.key))
      .map((route) => `${route.key} (${route.handler})`);
    expect(missing).toEqual([]);
  });

  it('el baseline sólo nombra rutas que existen y siguen sin decorador', () => {
    const undecorated = new Set(
      routes.filter((route) => !isDecorated(route)).map((route) => route.key),
    );
    const stale = readBaseline().filter((key) => !undecorated.has(key));
    expect(stale).toEqual([]);
  });

  it('el baseline está ordenado, sin repetidos, y su tamaño es BASELINE_SIZE', () => {
    const baseline = readBaseline();
    expect(baseline).toEqual([...new Set(baseline)].sort());
    expect(baseline.length).toBe(BASELINE_SIZE);
  });

  it('una ruta lleva @Audited o @NotAudited, no los dos', () => {
    const both = routes
      .filter((route) => route.audited && route.notAudited !== undefined)
      .map((route) => route.handler);
    expect(both).toEqual([]);
  });

  it('una ruta @Public que muta lleva @NotAudited: sin actor no hay sello', () => {
    const offenders = routes
      .filter((route) => route.isPublic && route.notAudited === undefined)
      .map((route) => `${route.key} (${route.handler})`);
    expect(offenders).toEqual([]);
  });

  it('@NotAudited nombra su motivo', () => {
    const empty = routes
      .filter((route) => route.notAudited?.trim() === '')
      .map((route) => route.handler);
    expect(empty).toEqual([]);
  });

  it('@Audited usa un verbo de negocio en MAYÚSCULAS y una tabla en snake_case', () => {
    const malformed = routes
      .filter(
        (route) =>
          route.audited &&
          (!ACTION_FORMAT.test(route.audited.action) ||
            !ENTITY_FORMAT.test(route.audited.entity)),
      )
      .map(
        (route) =>
          `${route.handler}: ${route.audited?.action} / ${route.audited?.entity}`,
      );
    expect(malformed).toEqual([]);
  });

  it('dos módulos no usan la misma acción de bitácora', () => {
    // `action` es texto libre en la tabla (informe C §1.4.3): quien lee la
    // bitácora no podría distinguir dos cosas distintas con el mismo nombre.
    const collisions = [...actionLiteralsByModule()]
      .filter(([, modules]) => modules.size > 1)
      .map(([action, modules]) => `${action}: ${[...modules].join(', ')}`);
    expect(collisions).toEqual([]);
  });
});
