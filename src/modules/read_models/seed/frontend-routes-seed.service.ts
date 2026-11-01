import { Injectable } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { existsSync, readFileSync } from 'node:fs';
import { CONCEPTS, deterministicId } from '../../../common/constants/concepts';
import { FrontendRoutes, PortalSurfaces } from '../entities';
import { RM } from '../read_models.concepts';
import bundledParts from './partes.seed.json';

/** Superficies de la app: las cuatro que reconoce la taxonomía de partes (03 §2.1). */
export const PORTAL_SURFACE_CODES = [
  'WEB',
  'MOBILE',
  'WEB_PUBLICO',
  'INSIGHTS',
] as const;
export type PortalSurfaceCode = (typeof PORTAL_SURFACE_CODES)[number];

interface SurfaceSeed {
  readonly name: string;
  readonly internal: boolean;
  readonly defaultRoute: string;
  readonly description: string;
}

const SURFACES: Record<PortalSurfaceCode, SurfaceSeed> = {
  WEB: {
    name: 'Portal web',
    internal: true,
    defaultRoute: '/dashboard',
    description: 'Área autenticada del portal Angular (armazón con menú).',
  },
  MOBILE: {
    name: 'App móvil',
    internal: true,
    defaultRoute: '/',
    description: 'App Flutter (mantra_core_health_mobile).',
  },
  WEB_PUBLICO: {
    name: 'Portal web público',
    internal: false,
    defaultRoute: '/search',
    description:
      'Rutas sin sesión: buscador, acceso, registro y verificaciones.',
  },
  INSIGHTS: {
    name: 'AloVida Insights',
    internal: true,
    defaultRoute: '/insights',
    description: 'Portal de inteligencia de marketing, fuera del armazón.',
  },
};

/**
 * Una parte (pantalla) del registro. Es la misma forma que emite
 * `scripts/export-partes.mjs` del front (`docs/partes/partes.json`).
 */
export interface PartSeedEntry {
  readonly portal: PortalSurfaceCode;
  readonly group: string;
  readonly sectionPath: string;
  readonly module: string | null;
  readonly routePattern: string;
  readonly routeCode: string;
  readonly pageTitle: string;
}

/** Lo que una pasada del seeder insertó o cambió. */
export interface FrontendRoutesSeedCounters {
  /** Superficies creadas. */
  surfaces: number;
  /** Rutas creadas. */
  routes: number;
  /** Rutas existentes cuyo título, grupo o patrón cambió, o que se reactivaron. */
  updated: number;
  /** Rutas que ya no están en el archivo y pasaron a `DEPRECATED`. */
  deprecated: number;
}

const ROUTE_CODE_MAX = 100;

/** Valida el archivo entero antes de tocar la base: un dato roto no siembra a medias. */
export function validateParts(raw: unknown): PartSeedEntry[] {
  if (!Array.isArray(raw)) {
    throw new Error('El archivo de partes debe ser un arreglo de rutas');
  }
  const codes = new Set<string>();
  const patterns = new Set<string>();
  return raw.map((item, index) => {
    const entry = item as Partial<PartSeedEntry>;
    const where = `partes[${index}]`;
    if (!entry.portal || !PORTAL_SURFACE_CODES.includes(entry.portal)) {
      throw new Error(`${where}: portal desconocido (${String(entry.portal)})`);
    }
    for (const key of [
      'routeCode',
      'routePattern',
      'pageTitle',
      'group',
    ] as const) {
      if (typeof entry[key] !== 'string' || entry[key].trim() === '') {
        throw new Error(`${where}: falta ${key}`);
      }
    }
    if (entry.routeCode!.length > ROUTE_CODE_MAX) {
      throw new Error(
        `${where}: routeCode excede ${ROUTE_CODE_MAX} caracteres`,
      );
    }
    if (!entry.routePattern!.startsWith('/')) {
      throw new Error(`${where}: routePattern debe empezar con «/»`);
    }
    const codeKey = `${entry.portal}|${entry.routeCode}`;
    const patternKey = `${entry.portal}|${entry.routePattern}`;
    if (codes.has(codeKey) || patterns.has(patternKey)) {
      throw new Error(
        `${where}: routeCode o routePattern duplicado en ${entry.portal}`,
      );
    }
    codes.add(codeKey);
    patterns.add(patternKey);
    return {
      portal: entry.portal,
      group: entry.group!,
      sectionPath: entry.sectionPath ?? '',
      module: entry.module ?? null,
      routePattern: entry.routePattern!,
      routeCode: entry.routeCode!,
      pageTitle: entry.pageTitle!,
    };
  });
}

/**
 * Siembra el mapa «pantalla → superficie → dominio» (`read_models.portal_surfaces`
 * y `read_models.frontend_routes`) del que el panel de uso y errores resuelve
 * cada `route_template` a su `route_code` (03 §2.1: la unión es la taxonomía).
 *
 * ## Fuente
 *
 * `PARTES_JSON_PATH` (el `docs/partes/partes.json` que genera el front) si
 * existe; si no, el fixture versionado `partes.seed.json`, extraído del registro
 * de navegación y de `app.routes.ts` del front.
 *
 * ## Idempotencia
 *
 * Ids deterministas; cada fila se crea sólo si falta y se toca sólo si algo
 * cambió. Una segunda pasada con el mismo archivo devuelve todo en 0. Lo que ya
 * no está en el archivo pasa a `DEPRECATED` (no se borra: los eventos viejos
 * siguen resolviendo) y vuelve a `ACTIVE` si reaparece.
 */
@Injectable()
export class FrontendRoutesSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FrontendRoutesSeedService.name);
  }

  /** Lee el archivo externo si está configurado y existe; si no, el fixture. */
  private source(): { origin: string; parts: PartSeedEntry[] } {
    const external = process.env.PARTES_JSON_PATH;
    if (external && existsSync(external)) {
      return {
        origin: external,
        parts: validateParts(JSON.parse(readFileSync(external, 'utf8'))),
      };
    }
    return { origin: 'partes.seed.json', parts: validateParts(bundledParts) };
  }

  /**
   * Ejecuta el seed.
   *
   * @param parts - Rutas a sembrar; por omisión, las de la fuente configurada.
   */
  async run(
    parts?: readonly PartSeedEntry[],
  ): Promise<FrontendRoutesSeedCounters> {
    const origin = parts ? 'argumento' : undefined;
    const source = parts
      ? { origin: origin!, parts: validateParts(parts) }
      : this.source();
    const em = this.orm.em.fork();
    const now = new Date();
    const counters: FrontendRoutesSeedCounters = {
      surfaces: 0,
      routes: 0,
      updated: 0,
      deprecated: 0,
    };

    for (const code of PORTAL_SURFACE_CODES) {
      const wanted = source.parts.filter((part) => part.portal === code);
      const surface = await this.ensureSurface(em, code, counters, now);
      await this.syncRoutes(em, surface.id, code, wanted, counters, now);
    }
    await em.flush();

    this.logger.info(
      {
        event: 'seed.read_models.frontend_routes',
        origin: source.origin,
        ...counters,
      },
      'Superficies y rutas del frontend garantizadas',
    );
    return counters;
  }

  private async ensureSurface(
    em: EntityManager,
    code: PortalSurfaceCode,
    counters: FrontendRoutesSeedCounters,
    now: Date,
  ): Promise<{ id: string }> {
    const existing = await em.findOne(PortalSurfaces, { portalCode: code });
    if (existing) return existing;
    const seed = SURFACES[code];
    const created = em.create(
      PortalSurfaces,
      {
        id: deterministicId(`read_models:portal_surface:${code}`),
        portalCode: code,
        name: seed.name,
        portalTypeConceptId: seed.internal
          ? RM.PORTAL_TYPE_INTERNAL
          : RM.PORTAL_TYPE_PUBLIC,
        tenantScoped: false,
        patientScoped: false,
        defaultRoute: seed.defaultRoute,
        description: seed.description,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    await em.flush();
    counters.surfaces += 1;
    return created;
  }

  private async syncRoutes(
    em: EntityManager,
    surfaceId: string,
    portal: PortalSurfaceCode,
    wanted: readonly PartSeedEntry[],
    counters: FrontendRoutesSeedCounters,
    now: Date,
  ): Promise<void> {
    const rows = await em.find(FrontendRoutes, { portalSurfaceId: surfaceId });
    const byCode = new Map(rows.map((row) => [row.routeCode, row]));
    const byPattern = new Map(rows.map((row) => [row.routePattern, row]));
    const keep = new Set<string>();

    for (const part of wanted) {
      const row =
        byCode.get(part.routeCode) ?? byPattern.get(part.routePattern);
      if (!row) {
        em.create(
          FrontendRoutes,
          {
            id: deterministicId(
              `read_models:frontend_route:${portal}:${part.routeCode}`,
            ),
            portalSurfaceId: surfaceId,
            routeCode: part.routeCode,
            routePattern: part.routePattern,
            pageTitle: part.pageTitle,
            navigationGroup: part.group,
            requiresTenantContext: false,
            requiresPatientContext: false,
            statusConceptId: CONCEPTS.STATE_ACTIVE,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        counters.routes += 1;
        keep.add(part.routeCode);
        continue;
      }
      keep.add(row.routeCode);
      keep.add(part.routeCode);
      const changed =
        row.routeCode !== part.routeCode ||
        row.routePattern !== part.routePattern ||
        row.pageTitle !== part.pageTitle ||
        row.navigationGroup !== part.group ||
        row.statusConceptId !== CONCEPTS.STATE_ACTIVE;
      if (changed) {
        row.routeCode = part.routeCode;
        row.routePattern = part.routePattern;
        row.pageTitle = part.pageTitle;
        row.navigationGroup = part.group;
        row.statusConceptId = CONCEPTS.STATE_ACTIVE;
        row.updatedAt = now;
        counters.updated += 1;
      }
    }

    for (const row of rows) {
      if (keep.has(row.routeCode)) continue;
      if (row.statusConceptId === RM.ROUTE_DEPRECATED) continue;
      row.statusConceptId = RM.ROUTE_DEPRECATED;
      row.updatedAt = now;
      counters.deprecated += 1;
    }
  }
}
